import json
import os
import sys
import argparse
from typing import Dict, List, Any, TypedDict

from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from langgraph.graph import StateGraph

from dotenv import load_dotenv

from utils.embedding_generator import generate_embeddings, sanitize_filename


# Helper for debug logging to stderr
def debug_log(message: str):
    print(f"[DEBUG] {message}", file=sys.stderr)


# Replace all print(...log...) with debug_log(...)


# Load environment variables with improved path handling
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("GOOGLE_API_KEY")


# Define the state for our graph
class AnalysisState(TypedDict):
    product_analysis: str
    competitor_analysis: str
    suggestions: str
    final_report: str
    asin: str  # Added to track the product ASIN
    keyword: str  # Added to track the search keyword


# Functions to load FAISS indices
import shutil


def load_faiss_index(index_path: str, force_rebuild=False, asin=None, keyword=None):
    """Load a pre-built FAISS index, with dangerous deserialization allowed (safe for local trusted files). If loading fails, optionally auto-rebuild."""
    try:
        debug_log(f"Loading FAISS index: {index_path}")
        return FAISS.load_local(
            index_path, embedding_model, allow_dangerous_deserialization=True
        )
    except Exception as e:
        print(
            f"[ERROR] Failed to load FAISS index from {index_path}: {str(e)}",
            file=sys.stderr,
        )
        if force_rebuild and asin and keyword:
            print(
                f"[WARN] Deleting and regenerating vectorstore: {index_path}",
                file=sys.stderr,
            )
            try:
                if os.path.exists(index_path):
                    shutil.rmtree(index_path)
            except Exception as del_e:
                print(
                    f"[ERROR] Failed to delete vectorstore {index_path}: {del_e}",
                    file=sys.stderr,
                )
            from utils.embedding_generator import generate_embeddings

            regen_success = generate_embeddings(asin, keyword)
            if regen_success:
                try:
                    debug_log(f"Retrying FAISS load after regeneration: {index_path}")
                    return FAISS.load_local(
                        index_path,
                        embedding_model,
                        allow_dangerous_deserialization=True,
                    )
                except Exception as e2:
                    print(
                        f"[ERROR] Still failed to load FAISS after regeneration: {e2}",
                        file=sys.stderr,
                    )
            else:
                print(
                    f"[ERROR] Regeneration of vectorstore failed for {index_path}",
                    file=sys.stderr,
                )
        return None


# Node 1: Product Analysis (only considers the product's own data)
def analyze_product(state: AnalysisState, force_rebuild=False) -> AnalysisState:
    asin = state["asin"]
    keyword = state["keyword"]
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, ".."))
    data_dir = os.path.join(project_root, "data")
    product_index_path = os.path.join(data_dir, f"{asin}_faiss")
    product_index = load_faiss_index(
        product_index_path, force_rebuild=force_rebuild, asin=asin, keyword=keyword
    )
    if not product_index:
        state["product_analysis"] = (
            f"Error: Could not load product index for ASIN {asin}."
        )
        return state
    retriever = product_index.as_retriever(search_kwargs={"k": 5})
    product_context = retriever.invoke(
        "product features, specifications, customer reviews"
    )
    debug_log(f"Product context for LLM: {product_context}")
    if not product_context or (
        isinstance(product_context, list) and not product_context
    ):
        state["product_analysis"] = "Error: No product context available for analysis."
        return state
    product_analysis_prompt = ChatPromptTemplate.from_template(
        """
        You are a product analyst tasked with evaluating a product based on its details and reviews.
        Analyze the following product information and provide a comprehensive analysis:
        1. Identify the key features and specifications of the product
        2. Summarize the positive aspects mentioned in reviews
        3. Summarize the negative aspects mentioned in reviews
        4. Identify potential improvements based on customer feedback
        5. Evaluate the overall customer satisfaction
        Product context:
        {context}
        Provide a detailed analysis that helps understand the product's strengths and weaknesses.
        """
    )
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash", google_api_key=api_key, temperature=0
    )
    product_chain = product_analysis_prompt | llm | StrOutputParser()
    product_analysis = product_chain.invoke({"context": product_context})
    if "Unable to determine" in product_analysis or "Placeholder" in product_analysis:
        print("[WARN] LLM returned placeholder output for product analysis.")
    state["product_analysis"] = product_analysis
    return state


# Node 2: Competitor Analysis and Suggestions
def analyze_competitors(state: AnalysisState, force_rebuild=False) -> AnalysisState:
    asin = state["asin"]
    keyword = state["keyword"]
    safe_keyword = sanitize_filename(keyword)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, ".."))
    data_dir = os.path.join(project_root, "data")
    product_index_path = os.path.join(data_dir, f"{asin}_faiss")
    competitor_index_path = os.path.join(data_dir, f"{safe_keyword}_faiss")
    product_index = load_faiss_index(
        product_index_path, force_rebuild=force_rebuild, asin=asin, keyword=keyword
    )
    competitor_index = load_faiss_index(
        competitor_index_path, force_rebuild=force_rebuild, asin=asin, keyword=keyword
    )
    if not product_index or not competitor_index:
        state["competitor_analysis"] = "Error: Could not load indices."
        state["suggestions"] = "Error: Could not generate suggestions."
        return state
    competitor_retriever = competitor_index.as_retriever(search_kwargs={"k": 5})
    competitor_context = competitor_retriever.invoke(
        "competitor features, advantages, reviews"
    )
    debug_log(f"Competitor context for LLM: {competitor_context}")
    if not competitor_context or (
        isinstance(competitor_context, list) and not competitor_context
    ):
        state["competitor_analysis"] = (
            "Error: No competitor context available for analysis."
        )
        state["suggestions"] = "Error: No competitor context available for suggestions."
        return state
    competitor_analysis_prompt = ChatPromptTemplate.from_template(
        """
        You are a competitive market analyst. You need to compare a product with its competitors and identify key differences.
        First, review the analysis of the main product:
        {product_analysis}
        Now, analyze the competitor information:
        {competitor_context}
        Provide a detailed analysis that:
        1. Identifies unique features that competitors offer
        2. Highlights areas where competitors are receiving positive reviews
        3. Compares pricing and value proposition
        4. Analyzes where competitors might be outperforming the main product
        5. Identifies market gaps or opportunities
        Focus on actionable insights about what competitors are doing differently.
        """
    )
    suggestions_prompt = ChatPromptTemplate.from_template(
        """
        You are a product strategy consultant. Based on the product analysis and competitive analysis, provide strategic recommendations.
        Product analysis:
        {product_analysis}
        Competitor analysis:
        {competitor_analysis}
        Provide specific, actionable suggestions for:
        1. Product improvements that would address customer pain points
        2. Features that could be added to match or surpass competitors
        3. Marketing angles that could highlight product strengths
        4. Pricing or positioning strategies
        5. Ways to better address customer needs identified in reviews
        Each suggestion should be specific, practical, and directly tied to insights from the analysis.
        """
    )
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash", google_api_key=api_key, temperature=0
    )
    competitor_chain = competitor_analysis_prompt | llm | StrOutputParser()
    competitor_analysis = competitor_chain.invoke(
        {
            "product_analysis": state["product_analysis"],
            "competitor_context": competitor_context,
        }
    )
    if (
        "Placeholder" in competitor_analysis
        or "Unable to determine" in competitor_analysis
    ):
        print("[WARN] LLM returned placeholder output for competitor analysis.")
    state["competitor_analysis"] = competitor_analysis
    suggestions_chain = suggestions_prompt | llm | StrOutputParser()
    suggestions = suggestions_chain.invoke(
        {
            "product_analysis": state["product_analysis"],
            "competitor_analysis": state["competitor_analysis"],
        }
    )
    state["suggestions"] = suggestions
    return state


# Node 3: Final Report Generation
def generate_final_report(state: AnalysisState) -> AnalysisState:
    """Generate a comprehensive final report combining all analyses with structured pros and cons."""
    asin = state["asin"]
    keyword = state["keyword"]

    # Updated prompt for structured output with pros/cons for all products
    final_report_prompt = ChatPromptTemplate.from_template(
        """
    You are creating a detailed product analysis report for ASIN: {asin} with search keyword: {keyword}.
    
    Based on the provided analyses, create a structured report that follows this EXACT FORMAT:
    
    1. Extract pros and cons for the main product AND for each competitor product
    2. Identify key changes needed to increase sales for the main product
    3. Create a brief product description and summary of the main problems
    4. Format your complete analysis with clear sections
    
    Use this information:
    
    ## Product Analysis
    {product_analysis}
    
    ## Competitor Analysis
    {competitor_analysis}
    
    ## Strategic Recommendations
    {suggestions}
    
    Your response MUST be structured as a valid JSON object with these exact keys:
    {{
        "product_summary": {{
            "description": "Brief description of the main product",
            "main_problems": "Summary of key problems with the main product"
        }},
        "main_product": {{
            "asin": "{asin}",
            "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4", "Pro 5"],
            "cons": ["Con 1", "Con 2", "Con 3", "Con 4", "Con 5"]
        }},
        "competitors": [
            {{
                "identifier": "Competitor 1",
                "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4", "Pro 5"],
                "cons": ["Con 1", "Con 2", "Con 3", "Con 4", "Con 5"]
            }},
            // Additional competitors follow the same format
        ],
        "key_changes_for_sales": ["Change 1", "Change 2", "Change 3", "Change 4", "Change 5"],
        "complete_report": {{
            "product_analysis": "Detailed analysis of the main product",
            "competitor_analysis": "Analysis of competitors",
            "recommendations": "Strategic recommendations"
        }}
    }}
    
    Identify at least 3-5 competitor products from the competitor analysis and provide pros and cons for each.
    Make sure your response is VALID JSON that can be parsed by Python's json.loads() function.
    """
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",  # Updated model name
        google_api_key=api_key,
        temperature=0,
    )

    final_report_chain = final_report_prompt | llm | StrOutputParser()

    # Get the JSON-formatted report
    json_report = final_report_chain.invoke(
        {
            "asin": asin,
            "keyword": keyword,
            "product_analysis": state["product_analysis"],
            "competitor_analysis": state["competitor_analysis"],
            "suggestions": state["suggestions"],
        }
    )

    # --- Clean and parse JSON output ---
    try:
        result_clean = json_report.strip()
        if result_clean.startswith("```json"):
            result_clean = result_clean[7:]
        if result_clean.endswith("```"):
            result_clean = result_clean[:-3]
        result_clean = "\n".join(
            line
            for line in result_clean.splitlines()
            if not line.strip().startswith("//")
        )
        result_data = json.loads(result_clean)
    except Exception:
        result_data = {}
    # --- Ensure all required fields ---
    required_fields = {
        "product_summary": {"description": "", "main_problems": ""},
        "main_product": {"asin": asin, "pros": [], "cons": []},
        "competitors": [],
        "key_changes_for_sales": [],
        "complete_report": {
            "product_analysis": "",
            "competitor_analysis": "",
            "recommendations": "",
        },
    }
    for key, val in required_fields.items():
        if key not in result_data:
            result_data[key] = val
    state["final_report"] = json.dumps(result_data, indent=2)
    return state


# Set up the LangGraph
def build_graph(force_rebuild=False):
    graph = StateGraph(AnalysisState)
    # Wrap nodes to pass force_rebuild
    graph.add_node(
        "analyze_product",
        lambda state: analyze_product(state, force_rebuild=force_rebuild),
    )
    graph.add_node(
        "analyze_competitors",
        lambda state: analyze_competitors(state, force_rebuild=force_rebuild),
    )
    graph.add_node("generate_final_report", generate_final_report)
    graph.add_edge("analyze_product", "analyze_competitors")
    graph.add_edge("analyze_competitors", "generate_final_report")
    graph.set_entry_point("analyze_product")
    return graph.compile()


def main(asin: str, keyword: str, output_json=True, force_rebuild=False):
    """Main function to run the analysis process."""
    if not output_json:
        print(f"Starting analysis for ASIN: {asin} and keyword: {keyword}")
    global embedding_model
    embedding_model = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    if not output_json:
        print("Preparing vector embeddings...")
    if force_rebuild:
        # Delete vectorstores if they exist
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, ".."))
        data_dir = os.path.join(project_root, "data")
        safe_keyword = sanitize_filename(keyword)
        product_index_path = os.path.join(data_dir, f"{asin}_faiss")
        competitor_index_path = os.path.join(data_dir, f"{safe_keyword}_faiss")
        for path in [product_index_path, competitor_index_path]:
            if os.path.exists(path):
                debug_log(f"Deleting vectorstore: {path}")
                shutil.rmtree(path)
    embedding_success = generate_embeddings(asin, keyword)
    if not embedding_success:
        error_msg = "Failed to generate required embeddings. Analysis cannot proceed."
        if not output_json:
            print(f"Error: {error_msg}")
        error_result = {"error": True, "message": error_msg}
        if output_json:
            print(json.dumps(error_result))
        return
    if not output_json:
        print("Embeddings ready. Starting analysis...")
    initial_state: AnalysisState = {
        "product_analysis": "",
        "competitor_analysis": "",
        "suggestions": "",
        "final_report": "",
        "asin": asin,
        "keyword": keyword,
    }
    graph = build_graph(force_rebuild=force_rebuild)
    result = graph.invoke(initial_state)
    safe_keyword = sanitize_filename(keyword)
    json_filename = f"{asin}_{safe_keyword}_analysis.json"
    try:
        raw_report = result["final_report"]
        report_data = json.loads(raw_report)
        with open(json_filename, "w") as f:
            json.dump(report_data, f, indent=2)
        if output_json:
            print("===BEGIN_JSON===")
            print(json.dumps(report_data))
            print("===END_JSON===")
            return
        print(f"\n==== PRODUCT ANALYSIS SUMMARY FOR {asin} ====\n")
        print("PRODUCT SUMMARY:")
        print(f"Description: {report_data['product_summary']['description']}")
        print(f"Main Problems: {report_data['product_summary']['main_problems']}")
        print("\nMAIN PRODUCT PROS:")
        for i, pro in enumerate(report_data["main_product"]["pros"], 1):
            print(f"{i}. {pro}")
        print("\nMAIN PRODUCT CONS:")
        for i, con in enumerate(report_data["main_product"]["cons"], 1):
            print(f"{i}. {con}")
        print("\nCOMPETITOR PRODUCTS:")
        for i, competitor in enumerate(report_data["competitors"], 1):
            print(f"\nCompetitor {i}:")
            print(f"Top Pros:")
            for j, pro in enumerate(competitor["pros"][:3], 1):
                print(f"  {j}. {pro}")
            print(f"Top Cons:")
            for j, con in enumerate(competitor["cons"][:3], 1):
                print(f"  {j}. {con}")
        print("\nKEY CHANGES NEEDED:")
        for i, change in enumerate(report_data["key_changes_for_sales"], 1):
            print(f"{i}. {change}")
        print(f"\nFull JSON report saved to {json_filename}")
    except Exception as e:
        print(f"Error saving or displaying report: {e}", file=sys.stderr)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Amazon Product Analysis Tool")
    parser.add_argument("--asin", required=True, help="The Amazon ASIN to analyze")
    parser.add_argument(
        "--keyword", required=True, help="The search keyword for finding competitors"
    )
    parser.add_argument(
        "--json", action="store_true", help="Output only JSON format (for API use)"
    )
    parser.add_argument(
        "--force-rebuild",
        action="store_true",
        help="Force delete and rebuild vectorstores from MongoDB",
    )
    args = parser.parse_args()
    if len(sys.argv) == 1:
        print("====== Amazon Product Analysis Tool ======")
        print(
            "This tool will analyze a product and its competitors based on Amazon data."
        )
        asin = input("Enter the product ASIN: ")
        if not asin:
            print("Error: ASIN is required.")
            sys.exit(1)
        keyword = input("Enter the search keyword for finding competitors: ")
        if not keyword:
            print("Error: Search keyword is required.")
            sys.exit(1)
        main(asin, keyword, output_json=False, force_rebuild=False)
    else:
        main(
            args.asin,
            args.keyword,
            output_json=args.json,
            force_rebuild=args.force_rebuild,
        )
