from typing import Dict, Optional, Tuple
import json
import os
import re
import subprocess
import time
from pymongo import MongoClient
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from bson import ObjectId
from datetime import datetime

# Initialize the embedding model
embedding_model = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")

class MongoJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles MongoDB ObjectId and datetime objects."""
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        elif isinstance(o, datetime):
            return o.isoformat()  # Convert datetime to ISO format string
        return super().default(o)

def connect_to_mongodb():
    """Connect to MongoDB and return the client."""
    client = MongoClient("mongodb://localhost:27017/")
    return client

def sanitize_filename(name: str) -> str:
    """Convert a string to a safe filename by removing invalid characters."""
    return re.sub(r'[^a-zA-Z0-9_]', '_', name)

def check_vectorstore_exists(asin: str, keyword: str) -> Tuple[bool, bool]:
    """Check if vectorstores for the given ASIN and keyword already exist."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "../.."))
    data_dir = os.path.join(project_root, "data")
    
    safe_keyword = sanitize_filename(keyword)
    
    product_faiss_path = os.path.join(data_dir, f"{asin}_faiss")
    competitor_faiss_path = os.path.join(data_dir, f"{safe_keyword}_faiss")
    
    product_exists = os.path.exists(product_faiss_path)
    competitor_exists = os.path.exists(competitor_faiss_path)
    
    return product_exists, competitor_exists

def trigger_scraper(asin: str, keyword: str) -> bool:
    """Trigger the scraper to fetch data from Amazon.
    The scraper itself will check if the data already exists in MongoDB."""
    print(f"Triggering scraper for ASIN {asin} and keyword '{keyword}'...")
    
    try:
        # Using curl to make the request to the scraper API
        cmd = [
            "curl", "-X", "POST",
            "http://localhost:3000/scrape",
            "-H", "Content-Type: application/json",
            "-d", f'{{"asin": "{asin}", "keyword": "{keyword}"}}'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True,encoding='utf-8')
        
        # Check if the scraping was successful
        if result.returncode == 0 and '"status":"success"' in result.stdout:
            print("Scraping completed successfully")
            return True
        else:
            print(f"Scraping failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"Error triggering scraper: {str(e)}")
        return False

def get_product_data(asin: str) -> Dict:
    """Fetch product data from MongoDB using ASIN."""
    client = connect_to_mongodb()
    db = client["adbms_schema"]
    
    # Get product description and reviews
    product_data = {}
    
    # Fetch product description
    product_desc = db.descriptions.find_one({"asin": asin})
    if product_desc:
        product_data["description"] = product_desc
    
    # Fetch ALL product reviews (no limit)
    positive_reviews = list(db.reviews.find({"asin": asin, "review_type": "positive"}))
    critical_reviews = list(db.reviews.find({"asin": asin, "review_type": "critical"}))
    
    if positive_reviews or critical_reviews:
        product_data["reviews"] = {
            "positive": positive_reviews,
            "critical": critical_reviews
        }
    
    client.close()
    return product_data

def get_competitor_data(keyword: str, main_asin: str) -> Dict:
    """Fetch competitor data from MongoDB using keyword."""
    client = connect_to_mongodb()
    db = client["adbms_schema"]
    
    # Find competitor ASINs from search results
    search_results = db.search_results.find_one({
        "keyword": keyword,
        "excluded_asin": main_asin
    })
    
    competitors_data = {}
    
    if search_results and "competitor_asins" in search_results:
        # Get competitor ASINs (still limit to top 5 competitors)
        competitor_asins = search_results["competitor_asins"][:5]
        
        for competitor_asin in competitor_asins:
            competitor_info = {}
            
            # Fetch competitor description
            desc = db.descriptions.find_one({"asin": competitor_asin})
            if desc:
                competitor_info["description"] = desc
            
            # Fetch ALL competitor reviews (no limit)
            positive_reviews = list(db.reviews.find({"asin": competitor_asin, "review_type": "positive"}))
            critical_reviews = list(db.reviews.find({"asin": competitor_asin, "review_type": "critical"}))
            
            if positive_reviews or critical_reviews:
                competitor_info["reviews"] = {
                    "positive": positive_reviews,
                    "critical": critical_reviews
                }
            
            if competitor_info:
                competitors_data[competitor_asin] = competitor_info
    
    client.close()
    return competitors_data

def create_faiss_from_data(data: Dict, output_path: str) -> None:
    """Create a FAISS vectorstore directly from data dictionary."""
    try:
        # Convert the entire data to a string for embedding
        full_text = json.dumps(data,cls=MongoJSONEncoder)

        # For metadata, create a copy with ObjectIds converted to strings
        serializable_metadata = json.loads(full_text)

        # Create FAISS vectorstore directly with the full content
        vectorstore = FAISS.from_texts(
            texts=[full_text],
            embedding=embedding_model,
            metadatas=[serializable_metadata]  # Store the entire data as metadata
        )
        
        # Save the FAISS index to disk
        vectorstore.save_local(output_path)
        print(f"FAISS vectorstore saved to {output_path}")
        
    except Exception as e:
        print(f"Error creating FAISS vectorstore: {str(e)}")

def generate_embeddings(asin: str, keyword: str):
    """Generate embeddings for product and competitor data."""
    # Get the absolute path to the project root
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "../.."))
    
    # Create data directory if it doesn't exist
    data_dir = os.path.join(project_root, "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Sanitize keyword for safe filename
    safe_keyword = sanitize_filename(keyword)
    
    # Define output paths with improved naming convention
    product_faiss_path = os.path.join(data_dir, f"{asin}_faiss")
    competitor_faiss_path = os.path.join(data_dir, f"{safe_keyword}_faiss")
    
    # STEP 1: Check if vectorstores already exist
    product_vs_exists, competitor_vs_exists = check_vectorstore_exists(asin, keyword)
    
    if product_vs_exists and competitor_vs_exists:
        print(f"Vectorstores already exist for ASIN {asin} and keyword '{keyword}'")
        return True
    
    # STEP 2: Always trigger the scraper - it will handle checking if data exists
    # The scraper is responsible for checking MongoDB and only scraping if needed
    print("Ensuring data is available by triggering scraper...")
    scraper_success = trigger_scraper(asin, keyword)
    
    if not scraper_success:
        print("Failed to run scraper. Cannot guarantee data availability.")
        # We'll still try to generate embeddings from whatever data is in MongoDB
    else:
        # Wait a bit for MongoDB to be updated if scraping occurred
        print("Waiting for MongoDB to be updated if needed...")
        time.sleep(2)
    
    print("Starting vectorstore generation")
    print(f"Fetching data for ASIN {asin} and keyword '{keyword}'")
    
    # Create product vectorstore if needed
    if not product_vs_exists:
        # Get product data from MongoDB including ALL reviews
        product_data = get_product_data(asin)
        if product_data:
            # Create vectorstore for product
            create_faiss_from_data(product_data, product_faiss_path)
            
            # Report statistics
            review_count = 0
            if "reviews" in product_data:
                if "positive" in product_data["reviews"]:
                    review_count += len(product_data["reviews"]["positive"])
                if "critical" in product_data["reviews"]:
                    review_count += len(product_data["reviews"]["critical"])
            print(f"Embedded product with {review_count} reviews into {asin}_faiss")
        else:
            print(f"No data found for product with ASIN {asin}")
            return False
    
    # Create competitor vectorstore if needed
    if not competitor_vs_exists:
        # Get competitor data from MongoDB including ALL reviews
        competitor_data = get_competitor_data(keyword, asin)
        if competitor_data:
            # Create vectorstore for competitors
            create_faiss_from_data(competitor_data, competitor_faiss_path)
            
            # Report statistics
            competitor_count = len(competitor_data)
            total_review_count = 0
            for comp_asin, comp_info in competitor_data.items():
                if "reviews" in comp_info:
                    if "positive" in comp_info["reviews"]:
                        total_review_count += len(comp_info["reviews"]["positive"])
                    if "critical" in comp_info["reviews"]:
                        total_review_count += len(comp_info["reviews"]["critical"])
            print(f"Embedded {competitor_count} competitors with a total of {total_review_count} reviews into {safe_keyword}_faiss")
        else:
            print(f"No competitor data found for keyword '{keyword}'")
            return False
    
    print("Completed vectorstore generation")
    return True

if __name__ == "__main__":
    # Example usage - in production, these would come from API/user input
    sample_asin = "B07ZPML7NP"  # Example ASIN
    sample_keyword = "bluetooth headphones"  # Example keyword
    
    generate_embeddings(sample_asin, sample_keyword)