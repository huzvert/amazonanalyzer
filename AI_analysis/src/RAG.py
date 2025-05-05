import json
import os
import sys
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

# Debug API key loading
print(f"API Key loaded: {'Yes' if api_key else 'No'}")
print(f"Looking for .env file at: {env_path}")

if not api_key:
    raise ValueError("GOOGLE_API_KEY not found. Please create a .env file with your API key at the location shown above.")

# Initialize embedding model - using HuggingFace
embedding_model = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")

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
        model="gemini-2.0-flash-001",
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
        model="gemini-2.0-flash-001",
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
    """Generate a comprehensive final report combining all analyses."""
    asin = state["asin"]
    keyword = state["keyword"]
    
    final_report_prompt = ChatPromptTemplate.from_template("""
    You are creating a comprehensive product analysis report for ASIN: {asin} with search keyword: {keyword}.
    
    Please format this as a professional report with clear sections and bullet points where appropriate.
    
    ## Product Analysis
    {product_analysis}
    
    ## Competitor Analysis
    {competitor_analysis}
    
    ## Strategic Recommendations
    {suggestions}
    
    Summarize the most critical insights and provide a prioritized action plan.
    """)
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-001",
        google_api_key=api_key,
        temperature=0
    )
    
    final_report_chain = (
        final_report_prompt
        | llm
        | StrOutputParser()
    )
    
    final_report = final_report_chain.invoke({
        "asin": asin,
        "keyword": keyword,
        "product_analysis": state["product_analysis"],
        "competitor_analysis": state["competitor_analysis"],
        "suggestions": state["suggestions"]
    })
    
    state["final_report"] = final_report
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

def main(asin: str, keyword: str):
    """Main function to run the analysis process."""
    print(f"Starting analysis for ASIN: {asin} and keyword: {keyword}")
    
    # First, ensure embeddings exist by calling the generate_embeddings function
    print("Preparing vector embeddings...")
    embedding_success = generate_embeddings(asin, keyword)
    
    if not embedding_success:
        print("Error: Failed to generate required embeddings. Analysis cannot proceed.")
        return
    
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
    
    # Print or save the final report
    print(f"\n==== PRODUCT ANALYSIS REPORT FOR {asin} ====\n")
    print(result["final_report"])
    
    # Save to file with a specific filename
    safe_keyword = sanitize_filename(keyword)
    report_filename = f"{asin}_{safe_keyword}_analysis.md"
    with open(report_filename, "w") as f:
        f.write(result["final_report"])
    print(f"\nReport saved to {report_filename}")

if __name__ == "__main__":
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
    
    # Run the main analysis with the provided inputs
    main(asin, keyword)