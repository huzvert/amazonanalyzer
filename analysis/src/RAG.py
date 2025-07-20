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
def load_faiss_index(index_path: str):
    """Load a pre-built FAISS index."""
    try:
        return FAISS.load_local(index_path, embedding_model)
    except Exception as e:
        print(f"Error loading FAISS index from {index_path}: {str(e)}")
        return None

# Node 1: Product Analysis (only considers the product's own data)
def analyze_product(state: AnalysisState) -> AnalysisState:
    """Analyze only the product without considering competitors."""
    # Get the ASIN from the state
    asin = state["asin"]
    
    # Construct path to the product FAISS index
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, ".."))
    data_dir = os.path.join(project_root, "data")
    
    product_index_path = os.path.join(data_dir, f"{asin}_faiss")
    product_index = load_faiss_index(product_index_path)
    
    if not product_index:
        state["product_analysis"] = f"Error: Could not load product index for ASIN {asin}."
        return state
    
    # Retrieve relevant information from the vectorstore
    retriever = product_index.as_retriever(search_kwargs={"k": 5})
    product_context = retriever.invoke("product features, specifications, customer reviews")
    
    # Define the analysis prompt
    product_analysis_prompt = ChatPromptTemplate.from_template("""
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
    """)
    
    # Build the chain with Google Gemini model
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key,
        temperature=0
    )

    product_chain = (
        product_analysis_prompt
        | llm
        | StrOutputParser()
    )
    
    # Run the analysis
    product_analysis = product_chain.invoke({"context": product_context})
    state["product_analysis"] = product_analysis
    
    return state

# Node 2: Competitor Analysis and Suggestions
def analyze_competitors(state: AnalysisState) -> AnalysisState:
    """Compare product with competitors and generate suggestions."""
    # Get ASIN and keyword from the state
    asin = state["asin"]
    keyword = state["keyword"]
    safe_keyword = sanitize_filename(keyword)
    
    # Construct paths to product and competitor FAISS indices
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, ".."))
    data_dir = os.path.join(project_root, "data")
    
    product_index_path = os.path.join(data_dir, f"{asin}_faiss")
    competitor_index_path = os.path.join(data_dir, f"{safe_keyword}_faiss")
    
    product_index = load_faiss_index(product_index_path)
    competitor_index = load_faiss_index(competitor_index_path)
    
    if not product_index or not competitor_index:
        state["competitor_analysis"] = "Error: Could not load indices."
        state["suggestions"] = "Error: Could not generate suggestions."
        return state
    
    # Define the competitor analysis prompt
    competitor_analysis_prompt = ChatPromptTemplate.from_template("""
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
    """)
    
    # Define the suggestions prompt
    suggestions_prompt = ChatPromptTemplate.from_template("""
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
    
    # Retrieve relevant information from the competitor vectorstore
    competitor_retriever = competitor_index.as_retriever(search_kwargs={"k": 5})
    competitor_context = competitor_retriever.invoke("competitor features, advantages, reviews")
    
    # Build the competitor analysis chain with Google Gemini model
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key,
        temperature=0
    )
    
    competitor_chain = (
        competitor_analysis_prompt
        | llm
        | StrOutputParser()
    )
    
    # Run the competitor analysis
    competitor_analysis = competitor_chain.invoke({
        "product_analysis": state["product_analysis"],
        "competitor_context": competitor_context
    })
    state["competitor_analysis"] = competitor_analysis
    
    # Build the suggestions chain
    suggestions_chain = (
        suggestions_prompt
        | llm
        | StrOutputParser()
    )
    
    # Generate suggestions
    suggestions = suggestions_chain.invoke({
        "product_analysis": state["product_analysis"],
        "competitor_analysis": state["competitor_analysis"]
    })
    state["suggestions"] = suggestions
    
    return state

# Node 3: Final Report Generation
def generate_final_report(state: AnalysisState) -> AnalysisState:
    """Generate a comprehensive final report combining all analyses with structured pros and cons."""
    asin = state["asin"]
    keyword = state["keyword"]
    
    # Updated prompt for structured output with pros/cons for all products
    final_report_prompt = ChatPromptTemplate.from_template("""
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
    """)
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",  # Updated model name
        google_api_key=api_key,
        temperature=0
    )
    
    final_report_chain = (
        final_report_prompt
        | llm
        | StrOutputParser()
    )
    
    # Get the JSON-formatted report
    json_report = final_report_chain.invoke({
        "asin": asin,
        "keyword": keyword,
        "product_analysis": state["product_analysis"],
        "competitor_analysis": state["competitor_analysis"],
        "suggestions": state["suggestions"]
    })
    
    # Store the JSON string in the state
    state["final_report"] = json_report
    return state

# Set up the LangGraph
def build_graph():
    """Build the LangGraph workflow."""
    # Initialize the graph
    graph = StateGraph(AnalysisState)
    
    # Add nodes
    graph.add_node("analyze_product", analyze_product)
    graph.add_node("analyze_competitors", analyze_competitors)
    graph.add_node("generate_final_report", generate_final_report)
    
    # Define the edges
    graph.add_edge("analyze_product", "analyze_competitors")
    graph.add_edge("analyze_competitors", "generate_final_report")
    
    # Set the entry point
    graph.set_entry_point("analyze_product")
    
    return graph.compile()

def main(asin: str, keyword: str, output_json=True):
    """Main function to run the analysis process."""
    if not output_json:  # Only print this for non-API usage
        print(f"Starting analysis for ASIN: {asin} and keyword: {keyword}")
    
    # Initialize embedding model - using HuggingFace
    global embedding_model
    embedding_model = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    
    # First, ensure embeddings exist by calling the generate_embeddings function
    if not output_json:  # Only print this for non-API usage
        print("Preparing vector embeddings...")
    embedding_success = generate_embeddings(asin, keyword)
    
    if not embedding_success:
        error_msg = "Failed to generate required embeddings. Analysis cannot proceed."
        if not output_json:
            print(f"Error: {error_msg}")
        error_result = {
            "error": True,
            "message": error_msg
        }
        if output_json:
            print(json.dumps(error_result))
        return
    
    if not output_json:  # Only print this for non-API usage
        print("Embeddings ready. Starting analysis...")
    
    # Initialize the state with the ASIN and keyword
    initial_state: AnalysisState = {
        "product_analysis": "",
        "competitor_analysis": "",
        "suggestions": "",
        "final_report": "",
        "asin": asin,
        "keyword": keyword
    }
    
    # Build and run the graph
    graph = build_graph()
    result = graph.invoke(initial_state)
    
    # Save the JSON report
    safe_keyword = sanitize_filename(keyword)
    json_filename = f"{asin}_{safe_keyword}_analysis.json"
    
    try:
        # Clean the raw JSON string by removing code block markers if present
        raw_report = result["final_report"]
        
        # Remove markdown code block markers if present
        if raw_report.startswith("```json"):
            raw_report = raw_report[7:]  # Remove ```json
        if raw_report.endswith("```"):
            raw_report = raw_report[:-3]  # Remove ```
            
        # Remove any comment lines that start with //
        cleaned_lines = [line for line in raw_report.splitlines() if not line.strip().startswith("//")]
        raw_report = "\n".join(cleaned_lines)
        
        # Strip any leading/trailing whitespace
        raw_report = raw_report.strip()
        
        # Now parse the cleaned JSON
        report_data = json.loads(raw_report)
        
        # Save the JSON to file with proper formatting
        with open(json_filename, "w") as f:
            json.dump(report_data, f, indent=2)  # Use json.dump with indentation
        
        # If called from the API, just output the JSON
        if output_json:
            print(json.dumps(report_data))
            return
            
        # Print a summary to the console for interactive use
        print(f"\n==== PRODUCT ANALYSIS SUMMARY FOR {asin} ====\n")
        
        print("PRODUCT SUMMARY:")
        print(f"Description: {report_data['product_summary']['description']}")
        print(f"Main Problems: {report_data['product_summary']['main_problems']}")
        
        print("\nMAIN PRODUCT PROS:")
        for i, pro in enumerate(report_data['main_product']['pros'], 1):
            print(f"{i}. {pro}")
            
        print("\nMAIN PRODUCT CONS:")
        for i, con in enumerate(report_data['main_product']['cons'], 1):
            print(f"{i}. {con}")
        
        print("\nCOMPETITOR PRODUCTS:")
        for i, competitor in enumerate(report_data['competitors'], 1):
            print(f"\nCompetitor {i}:")
            print(f"Top Pros:")
            for j, pro in enumerate(competitor['pros'][:3], 1):  # Show top 3 pros for brevity
                print(f"  {j}. {pro}")
            print(f"Top Cons:")
            for j, con in enumerate(competitor['cons'][:3], 1):  # Show top 3 cons for brevity
                print(f"  {j}. {con}")
            
        print("\nKEY CHANGES NEEDED:")
        for i, change in enumerate(report_data['key_changes_for_sales'], 1):
            print(f"{i}. {change}")
        
        print(f"\nFull JSON report saved to {json_filename}")
        
        # Also save a markdown version for human reading
        md_filename = f"{asin}_{safe_keyword}_analysis.md"
        with open(md_filename, "w") as f:
            f.write(f"# Product Analysis Report for {asin}\n\n")
            f.write(f"## Product Summary\n\n")
            f.write(f"**Description**: {report_data['product_summary']['description']}\n\n")
            f.write(f"**Main Problems**: {report_data['product_summary']['main_problems']}\n\n")
            
            f.write(f"## Main Product Analysis\n\n")
            f.write(f"### Pros\n\n")
            for pro in report_data['main_product']['pros']:
                f.write(f"- {pro}\n")
            
            f.write(f"\n### Cons\n\n")
            for con in report_data['main_product']['cons']:
                f.write(f"- {con}\n")
            
            f.write(f"\n## Competitor Analysis\n\n")
            for i, competitor in enumerate(report_data['competitors'], 1):
                f.write(f"### Competitor {i}\n\n")
                f.write(f"**Pros**:\n\n")
                for pro in competitor['pros']:
                    f.write(f"- {pro}\n")
                f.write(f"\n**Cons**:\n\n")
                for con in competitor['cons']:
                    f.write(f"- {con}\n")
                f.write("\n")
                
            f.write(f"\n## Key Changes for Improved Sales\n\n")
            for change in report_data['key_changes_for_sales']:
                f.write(f"- {change}\n")
                
            f.write(f"\n## Complete Report\n\n")
            f.write(f"### Product Analysis\n\n")
            f.write(f"{report_data['complete_report']['product_analysis']}\n\n")
            
            f.write(f"### Competitor Analysis\n\n")
            f.write(f"{report_data['complete_report']['competitor_analysis']}\n\n")
            
            f.write(f"### Recommendations\n\n")
            f.write(f"{report_data['complete_report']['recommendations']}\n\n")
            
        print(f"Human-readable report saved to {md_filename}")
            
    except json.JSONDecodeError as e:
        error_msg = f"Warning: The report could not be parsed as JSON: {str(e)}"
        print(error_msg)
        
        if output_json:
            error_result = {
                "error": True,
                "message": error_msg,
                "rawOutput": result["final_report"][:500]  # First 500 chars for debugging
            }
            print(json.dumps(error_result))
            return
            
        print("First 200 characters of response:", result["final_report"][:200])
        
        # Try to clean up JSON before saving in the error case too
        raw_report = result["final_report"]
        if raw_report.startswith("```json"):
            raw_report = raw_report[7:]
        if raw_report.endswith("```"):
            raw_report = raw_report[:-3]
        # Remove any comment lines that start with //
        cleaned_lines = [line for line in raw_report.splitlines() if not line.strip().startswith("//")]
        raw_report = "\n".join(cleaned_lines)
        raw_report = raw_report.strip()
        
        # Still try to save with .json extension
        with open(json_filename, "w") as f:
            f.write(raw_report)  # Save cleaned text
            
        print(f"\nCleaned output saved to {json_filename} (may not be valid JSON)")

if __name__ == "__main__":
    # Set up argument parser
    parser = argparse.ArgumentParser(description="Amazon Product Analysis Tool")
    parser.add_argument('--asin', required=True, help='The Amazon ASIN to analyze')
    parser.add_argument('--keyword', required=True, help='The search keyword for finding competitors')
    parser.add_argument('--json', action='store_true', help='Output only JSON format (for API use)')
    
    # Parse arguments
    args = parser.parse_args()
    
    # If no command line arguments, fall back to interactive mode
    if len(sys.argv) == 1:
        # Get input from terminal
        print("====== Amazon Product Analysis Tool ======")
        print("This tool will analyze a product and its competitors based on Amazon data.")
        
        # Get ASIN from user
        asin = input("Enter the product ASIN: ")
        if not asin:
            print("Error: ASIN is required.")
            sys.exit(1)
        
        # Get keyword from user
        keyword = input("Enter the search keyword for finding competitors: ")
        if not keyword:
            print("Error: Search keyword is required.")
            sys.exit(1)
            
        # Run in interactive mode (not JSON-only output)
        main(asin, keyword, output_json=False)
    else:
        # Run with command line arguments
        main(args.asin, args.keyword, output_json=args.json)