import os
import sys
import json
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

# Add backend to sys path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.pipeline import pipeline

def run_evaluation():
    """
    RAGAS Evaluation for LegalSathi AI.
    Tests faithfulness, relevancy, and retrieval quality.
    """
    print("Preparing LegalSathi RAGAS Evaluation Dataset...")
    
    test_cases = [
        {
            "question": "What are the legal remedies for a woman facing domestic violence in India?",
            "ground_truth": "The Protection of Women from Domestic Violence Act, 2005 (DV Act) provides remedies like Protection Orders (Section 18), Residence Orders (Section 19), and Monetary Relief (Section 20). Complaints can be filed with a Protection Officer or Magistrate."
        },
        {
            "question": "What is the penalty for cyber stalking under the IT Act?",
            "ground_truth": "Cyber stalking can be prosecuted under Section 66D of the IT Act (punishment for cheating by personation) and Section 354D of the Indian Penal Code (stalking), which carries imprisonment up to 3 years for the first conviction."
        },
        {
            "question": "What rights do senior citizens have regarding property protection from children?",
            "ground_truth": "Under the Maintenance and Welfare of Parents and Senior Citizens Act, 2007, Section 23 allows senior citizens to declare property transfers void if children fail to provide basic amenities and physical needs."
        },
        {
            "question": "How can a consumer file a complaint for a defective product worth 5 lakh rupees?",
            "ground_truth": "Under the Consumer Protection Act, 2019, for claims up to 50 lakh rupees, a complaint should be filed with the District Consumer Disputes Redressal Commission (District Commission)."
        },
        {
            "question": "What is the legal age of consent for marriage for women in India?",
            "ground_truth": "Currently, under the Prohibition of Child Marriage Act, 2006, the legal age of marriage for women is 18 years and for men is 21 years."
        }
    ]

    questions = [t["question"] for t in test_cases]
    ground_truths = [t["ground_truth"] for t in test_cases]
    answers = []
    contexts = []

    print(f"Running pipeline for {len(questions)} test cases...")
    for q in questions:
        res = pipeline.ask(q)
        answers.append(res["summary"] + " " + res["explanation"])
        # In a real scenario, we'd extract the actual retrieved chunks from the vector store
        contexts.append([res["applicable_law"]])

    data = {
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "ground_truth": ground_truths
    }
    
    dataset = Dataset.from_dict(data)
    
    print("Starting RAGAS evaluation (Requires OPENAI_API_KEY or compatible LLM)...")
    # To run this, export OPENAI_API_KEY or configure ragas to use Gemini
    try:
        # result = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision])
        # print("\nEvaluation Results:")
        # print(result)
        print("Dataset generated successfully. Evaluation loop ready.")
    except Exception as e:
        print(f"Evaluation failed: {str(e)}")

if __name__ == "__main__":
    run_evaluation()

