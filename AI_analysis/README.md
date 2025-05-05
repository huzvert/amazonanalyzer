# Product Analysis Project

## Overview
The Product Analysis Project is designed to help companies analyze their products in comparison to competitors. By generating embeddings from product data, the project provides insights into areas of improvement and identifies deficiencies in the company's offerings.

## Project Structure
```
product-analysis-project
├── data
│   ├── product.json         # Contains the company's product data
│   └── competitor.json      # Contains competitor product data for comparison
├── src
│   ├── RAG.py               # Main script for generating embeddings and analysis
│   └── utils
│       └── embedding_generator.py  # Utility functions for embedding generation
├── requirements.txt         # Lists project dependencies
└── README.md                # Project documentation
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd product-analysis-project
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage
To run the analysis, execute the following command:
```
python src/RAG.py
```

This will generate embeddings from `product.json` and `competitor.json`, and produce an analysis report highlighting areas for product improvement.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License.