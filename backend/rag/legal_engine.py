import json
import logging
import os
import re
import ssl
import threading
import urllib.error
import urllib.parse
import urllib.request
from functools import lru_cache

from config.settings import settings

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACTS_PATH = os.path.join(BASE_DIR, "knowledge_base", "acts", "master_acts.json")
SECTIONS_PATH = os.path.join(BASE_DIR, "knowledge_base", "sections", "master_sections.json")

DISCLAIMER = (
    "This platform provides general legal information for education only, "
    "not legal advice. Please consult a qualified lawyer for advice on your specific case."
)

FALLBACK_GOV_URL = "https://www.indiacode.nic.in"
DEFAULT_INDIA_URL = "https://www.india.gov.in"

ALLOWED_GOV_DOMAINS = (
    "india.gov.in",
    "indiacode.nic.in",
    "egazette.gov.in",
    "nalsa.gov.in",
    "wcd.gov.in",
    "mha.gov.in",
    "labour.gov.in",
    "cybercrime.gov.in",
    "consumerhelpline.gov.in",
    "ncw.gov.in",
    "childlineindia.org.in",
    "scobserver.in",
    "sci.gov.in",
    "mohua.gov.in",
    "socialjustice.gov.in",
    "copyright.gov.in",
    "meity.gov.in",
    "consumeraffairs.nic.in",
    "gov.in",
    "nic.in",
)

_URL_CACHE = {}
_URL_CACHE_LOCK = threading.Lock()


def is_official_gov_domain(url: str) -> bool:
    if not url or not isinstance(url, str):
        return False
    url = url.strip()
    if not url.startswith("https://"):
        return False
    try:
        parsed = urllib.parse.urlparse(url)
        host = (parsed.netloc or "").split(":")[0].lower()
        if not host:
            return False
        return any(
            host == domain or host.endswith("." + domain)
            for domain in ALLOWED_GOV_DOMAINS
        )
    except Exception:
        return False


def validate_url(url: str, timeout: int = 4) -> str:
    if not url or not isinstance(url, str):
        return FALLBACK_GOV_URL
    url = url.strip()

    if url.startswith("http://"):
        url = "https://" + url[7:]
    if not url.startswith("https://"):
        return FALLBACK_GOV_URL

    if not is_official_gov_domain(url):
        return FALLBACK_GOV_URL

    with _URL_CACHE_LOCK:
        if url in _URL_CACHE:
            return _URL_CACHE[url]

    verified = False
    try:
        ctx = ssl.create_default_context()
        # Verify the certificate chain and hostname. Disabling these (as the
        # previous code did) would let a MITM host pass as an official .gov.in
        # source, defeating the entire citation-verification feature.
        ctx.check_hostname = True
        ctx.verify_mode = ssl.CERT_REQUIRED

        req = urllib.request.Request(
            url,
            method="HEAD",
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
                if resp.status in (200, 301, 302, 307, 308):
                    verified = True
        except urllib.error.HTTPError as e:
            if e.code in (200, 301, 302, 307, 308, 403):
                verified = True
            elif e.code == 405:
                req_get = urllib.request.Request(
                    url,
                    headers={
                        "User-Agent": (
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                            "AppleWebKit/537.36"
                        )
                    },
                )
                with urllib.request.urlopen(req_get, timeout=timeout, context=ctx) as resp2:
                    if resp2.status in (200, 301, 302, 307, 308):
                        verified = True
    except Exception:
        verified = False

    result_url = url if verified else FALLBACK_GOV_URL
    with _URL_CACHE_LOCK:
        _URL_CACHE[url] = result_url
    return result_url


DOMAINS = [
    {
        "name": "Women's Rights",
        "keywords": [
            "woman", "women", "wife", "husband", "domestic violence", "dowry", "marital",
            "stalking", "harassment", "molestation", "rape", "acid attack", "dowry death",
            "gender discrimination", "eve teasing", "grooming", "ex-wife",
        ],
        "kb_act_id": "dv_act_2005",
        "acts": [
            "Protection of Women from Domestic Violence Act, 2005",
            "Dowry Prohibition Act, 1961",
            "Section 498A, Indian Penal Code 1860 (cruelty by husband/relatives)",
            "Protection of Women from Sexual Harassment at Workplace (POSH) Act, 2013",
        ],
        "summary": (
            "Women facing domestic violence, cruelty, harassment or dowry demands are protected "
            "under several Indian laws. The Protection of Women from Domestic Violence Act, 2005 "
            "covers physical, sexual, verbal, emotional and economic abuse, and allows protection "
            "orders, residence orders and monetary relief."
        ),
        "explanation": (
            "Domestic violence includes physical, sexual, verbal, emotional and economic abuse "
            "within a shared household. A woman can file a complaint with a Protection Officer, a "
            "police station or directly with a Magistrate. Protection orders can stop the abuser "
            "from entering the home, and residence orders protect her right to stay. The law also "
            "applies to women in live-in relationships and covers harassment related to dowry "
            "demands."
        ),
        "rights": [
            "Right to protection from domestic violence under the DV Act, 2005",
            "Right to stay in the shared household (residence order)",
            "Right to monetary relief for expenses and losses suffered",
            "Right to protection orders and interim maintenance",
            "Right to file criminal complaint for cruelty (Section 498A IPC / BNS 2023)",
        ],
        "next_steps": [
            "Call the National Commission for Women helpline 1091 or State Women Helpline 181",
            "File a complaint at your local police station (FIR)",
            "Approach the Magistrate under the DV Act, 2005 for a protection order",
            "Contact a Protection Officer or a recognised service provider in your district",
            "Preserve medical records, photographs and messages as evidence",
        ],
        "required_documents": [
            "Proof of identity and address",
            "Medical reports and photographs of injuries (if any)",
            "Messages, emails, call records showing threats or harassment",
            "Bank statements if monetary relief / maintenance is sought",
            "Marriage certificate or proof of live-in relationship",
        ],
        "government_website": "https://wcd.gov.in",
    },
    {
        "name": "Children's Rights",
        "keywords": [
            "child", "children", "minor", "pocso", "sexual assault", "child labour",
            "kidnap", "abduction", "juvenile", "school", "guardian", "child marriage",
        ],
        "kb_act_id": "pocso_act_2012",
        "acts": [
            "Protection of Children from Sexual Offences (POCSO) Act, 2012",
            "The Juvenile Justice (Care and Protection of Children) Act, 2015",
            "Child Labour (Prohibition and Regulation) Act, 1986",
            "Prohibition of Child Marriage Act, 2006",
        ],
        "summary": (
            "Children are protected from sexual offences, exploitation and violence under the "
            "POCSO Act, 2012, the Juvenile Justice Act, 2015 and related laws. Any offence against "
            "a child under 18 is treated with special procedures and stringent punishment."
        ),
        "explanation": (
            "The POCSO Act, 2012 defines penetrative sexual assault, aggravated penetrative "
            "assault, sexual harassment and the use of children for pornographic purposes. It "
            "mandates special court processes, child-friendly recording of statements and "
            "immediate medical care. Reporting can be done by anyone, and the identity of the "
            "child must remain confidential. The Juvenile Justice Act also protects children in "
            "need of care and protection and regulates offences committed by minors."
        ),
        "rights": [
            "Right to protection from all forms of sexual offences under POCSO, 2012",
            "Right to confidentiality of identity during proceedings",
            "Right to child-friendly procedures and special courts",
            "Right to protection from child labour and exploitation",
            "Right to rehabilitation and care under the Juvenile Justice Act, 2015",
        ],
        "next_steps": [
            "Report immediately to the nearest police station or child helpline 1098",
            "Take the child for medical examination (free of cost under POCSO)",
            "Contact the Child Welfare Committee (CWC) of your district",
            "File an FIR and ensure the child's statement is recorded before a Magistrate",
            "Do not delay; POCSO cases have time-bound investigation and trial",
        ],
        "required_documents": [
            "Birth certificate or age proof of the child",
            "Medical report and forensic evidence",
            "School records and identification documents",
            "Any messages, photos or witnesses supporting the complaint",
        ],
        "government_website": "https://wcd.gov.in",
    },
    {
        "name": "Senior Citizen Rights",
        "keywords": [
            "senior citizen", "parent", "parents", "aged", "elderly", "abandon", "maintenance",
            "pension", "old age", "father", "mother", "grandparent", "care taker",
        ],
        "kb_act_id": "senior_citizen_act_2007",
        "acts": [
            "Maintenance and Welfare of Parents and Senior Citizens Act, 2007",
            "Right to maintenance under personal laws (Hindu Adoption and Maintenance Act, 1956, "
            "and others)",
        ],
        "summary": (
            "The Maintenance and Welfare of Parents and Senior Citizens Act, 2007 obliges "
            "children and relatives to maintain parents and senior citizens. It also allows "
            "senior citizens to get orders for maintenance, protection of life and property, and "
            "care."
        ),
        "explanation": (
            "A senior citizen can apply to the Maintenance Tribunal for monthly maintenance from "
            "children, grandchildren or relatives who have sufficient means. The Act also protects "
            "against abandonment and property-grabbing: a senior citizen may apply to a Tribunal "
            "to revoke a property transfer made under force or fraud. States also operate Old Age "
            "Homes and support schemes."
        ),
        "rights": [
            "Right to maintenance from children or relatives under the 2007 Act",
            "Right to protection from abandonment, abuse and property-grabbing",
            "Right to care in an old age home or recognised facility",
            "Right to claim monthly maintenance of up to Rs 10,000 (per state rules)",
        ],
        "next_steps": [
            "File a petition before the Maintenance Tribunal of your district",
            "Call the Senior Citizens Helpline 14567 or Elder Line 1090",
            "Register your details under state senior citizen welfare schemes",
            "Consult a legal aid centre for property protection orders",
        ],
        "required_documents": [
            "Proof of age (Aadhaar, voter ID or pension documents)",
            "Income and property details of the applicant",
            "Proof of relationship with the respondent (children/relatives)",
            "Evidence of neglect, abandonment or misuse of property",
        ],
        "government_website": "https://socialjustice.gov.in",
    },
    {
        "name": "Rental Laws",
        "keywords": [
            "rent", "rental", "tenant", "landlord", "eviction", "security deposit",
            "lease", "rented room", "rent agreement", "house owner", "flat",
        ],
        "kb_act_id": None,
        "acts": [
            "The Model Tenancy Act, 2021",
            "State Rent Control Acts (e.g., Delhi Rent Control Act, 1958)",
            "Indian Contract Act, 1872 (terms of the rent agreement)",
        ],
        "summary": (
            "Tenants and landlords are governed by the rent agreement and applicable state rent "
            "control laws. Eviction requires a valid notice period and a legal ground; a landlord "
            "cannot enter premises without consent or resort to self-help eviction."
        ),
        "explanation": (
            "The tenancy relationship is governed by the written rent agreement and state rent "
            "control statutes. A landlord can terminate the tenancy only on grounds such as "
            "non-payment of rent, unauthorised use, or bona fide need, and after proper notice. "
            "Forcing entry, cutting off utilities, or throwing out belongings without court "
            "proceedings is illegal and amounts to a civil wrong, and in some cases criminal "
            "trespass. Tenants also have the right to a refund of the security deposit subject to "
            "deductions for genuine damages."
        ),
        "rights": [
            "Right to quiet possession without unlawful interference",
            "Right to a proper notice period before eviction as per the agreement / state law",
            "Right to refund of security deposit (minus genuine deductions)",
            "Right against forcible entry and self-help eviction",
            "Right to lawful amenities and services promised in the agreement",
        ],
        "next_steps": [
            "Record the notice period required under your rent agreement and state law",
            "Respond in writing to any eviction notice and preserve copies",
            "Do not vacate under threat; eviction must follow legal process",
            "If forcibly evicted or harassed, file a complaint with the police and approach the "
            "Civil Court / Rent Authority",
            "Keep rent receipts, agreement and correspondence as evidence",
        ],
        "required_documents": [
            "Rent agreement / lease deed",
            "Rent receipts and payment records",
            "Security deposit receipts",
            "Written correspondence with the landlord",
        ],
        "government_website": "https://mohua.gov.in",
    },
    {
        "name": "Cyber Bullying & Harassment",
        "keywords": [
            "cyber", "online", "bullying", "harassment", "social media", "instagram",
            "facebook", "whatsapp", "defame", "threat online", "troll", "revenge porn",
            "morphed photo", "leak photo", "private video",
        ],
        "kb_act_id": "it_act_2000",
        "acts": [
            "Information Technology Act, 2000 (Sections 66A, 66C, 66D, 67, 67A)",
            "Section 354D, Indian Penal Code (stalking)",
            "Section 500 IPC (defamation) / corresponding provisions of BNS, 2023",
        ],
        "summary": (
            "Online bullying, harassment, defamation, identity theft and non-consensual sharing "
            "of intimate images are punishable under the Information Technology Act, 2000 and "
            "the Indian Penal Code. Victims can report to the police and to the platforms "
            "themselves."
        ),
        "explanation": (
            "The IT Act punishes identity theft (Section 66C), cheating by impersonation using "
            "computer resources (Section 66D), publishing obscene material (Section 67) and "
            "transmitting intimate images without consent (Section 67A). Defamation, stalking "
            "and criminal intimidation online attract IPC/BNS provisions as well. You should "
            "preserve screenshots, report the content to the platform to take it down, and file "
            "an FIR at a cyber crime cell or via the national cyber crime reporting portal."
        ),
        "rights": [
            "Right to report cyber offences to the police and cyber crime cells",
            "Right to request platforms to remove harassing content (content takedown)",
            "Right to protection from defamation, stalking and identity theft",
            "Right to privacy protection for intimate/private content",
        ],
        "next_steps": [
            "Preserve all evidence: screenshots, links, timestamps, device data",
            "Report the account/content on the platform (harassment / abuse options)",
            "File a complaint at cybercrime.gov.in or your local cyber cell",
            "Block the harasser and change compromised passwords",
            "If threats are serious, seek police protection and a lawyer",
        ],
        "required_documents": [
            "Screenshots and saved copies of abusive posts/messages",
            "Profile URLs and account IDs of the harasser",
            "IP address logs or device records if available",
            "Supporting witnesses or metadata",
        ],
        "government_website": "https://cybercrime.gov.in",
    },
    {
        "name": "Copyright",
        "keywords": [
            "copyright", "pirated", "infringement", "reproduce", "music", "song",
            "movie", "book", "article", "plagiarism", "fair use", "creative work",
        ],
        "kb_act_id": None,
        "acts": [
            "The Copyright Act, 1957 (as amended)",
            "Information Technology Act, 2000 (digital reproduction / intermediaries)",
        ],
        "summary": (
            "Copyright protects original literary, artistic, musical and dramatic works under "
            "the Copyright Act, 1957. Unauthorised reproduction, distribution or adaptation is "
            "infringement, giving the owner civil remedies and, in serious cases, criminal "
            "sanctions."
        ),
        "explanation": (
            "Copyright arises automatically upon creation of an original work and lasts, for "
            "literary and artistic works, for the author's lifetime plus 60 years. The owner has "
            "exclusive rights to reproduce, publish, perform and adapt the work. Infringement can "
            "be pursued through civil suits (injunction + damages) or criminal proceedings. "
            "Registration with the Copyright Office is not mandatory but strengthens evidence of "
            "ownership. Exceptions like fair dealing allow limited use for research, review or "
            "news reporting."
        ),
        "rights": [
            "Exclusive right to reproduce, publish, distribute and adapt the work",
            "Right to sue for infringement (injunction, damages, account of profits)",
            "Right to criminal remedies against wilful infringement",
            "Moral rights: right to authorship and integrity of the work",
        ],
        "next_steps": [
            "Document proof of creation (dated drafts, files, timestamps)",
            "Send a cease-and-desist notice to the infringer",
            "File a civil suit before the appropriate court for injunction and damages",
            "Report digital piracy to the platform (DMCA-style takedown)",
            "Consider registering the work with the Copyright Office",
        ],
        "required_documents": [
            "Proof of original authorship (dated drafts, emails, metadata)",
            "Copyright registration certificate (if registered)",
            "Evidence of the infringing reproduction",
            "Records of commercial loss, if claiming damages",
        ],
        "government_website": "https://copyright.gov.in",
    },
    {
        "name": "Consumer Rights",
        "keywords": [
            "consumer", "product", "refund", "defective", "defect", "warranty", "invoice",
            "repair", "shop", "shopkeeper", "seller", "online order", "cancellation",
            "billing", "spurious", "overcharge", "goods", "services", "false advertisement",
        ],
        "kb_act_id": "consumer_protection_2019",
        "acts": [
            "Consumer Protection Act, 2019",
            "Consumer Protection (E-Commerce) Rules, 2020",
        ],
        "summary": (
            "The Consumer Protection Act, 2019 protects consumers against defective goods, "
            "deficient services, unfair trade practices and misleading advertisements. It "
            "provides for redressal through District, State and National Consumer Commissions "
            "and includes a simpler e-filing process."
        ),
        "explanation": (
            "A consumer can file a complaint for defective goods, deficient services, unfair or "
            "restrictive trade practices, and misleading advertisements. The 2019 Act raises the "
            "pecuniary jurisdiction of the District Commission to Rs 1 crore and allows "
            "e-filing, video hearings and alternative dispute resolution (mediation). Claims can "
            "be filed online through the E-Daakhil portal, and penalties for false or misleading "
            "advertisements can be up to Rs 10 lakhs per the Act."
        ),
        "rights": [
            "Right to safety and quality of goods and services",
            "Right to be informed about price, quality and quantity",
            "Right to choose and to a fair deal (no unfair trade practices)",
            "Right to redressal for defective goods, deficient services and misleading ads",
            "Right to consumer awareness and education",
        ],
        "next_steps": [
            "Raise the issue with the seller/company through their customer care (keep records)",
            "Send a written complaint/legal notice with all documents",
            "File a complaint on the E-Daakhil portal or the District Consumer Commission",
            "Complain to the National Consumer Helpline (1915) for mediation",
            "If unresolved, approach the consumer commission with jurisdiction over the claim",
        ],
        "required_documents": [
            "Invoice, bill or order confirmation",
            "Warranty card and product details",
            "Photos / videos of the defect or service issue",
            "All correspondence with the seller",
        ],
        "government_website": "https://consumerhelpline.gov.in",
    },
    {
        "name": "Cyber Fraud",
        "keywords": [
            "fraud", "fraudulent", "scam", "scammed", "phishing", "bank fraud", "otp",
            "upi", "fake call", "investment scam", "loan scam", "money gone",
            "debit", "credit card fraud", "fake website",
        ],
        "kb_act_id": "it_act_2000",
        "acts": [
            "Information Technology Act, 2000 (Sections 66C, 66D)",
            "Indian Penal Code / Bharatiya Nyaya Sanhita 2023 (cheating - Section 420 IPC / "
            "Section 318 BNS)",
        ],
        "summary": (
            "Online financial fraud, phishing, OTP fraud and fake investment scams are "
            "punishable under the IT Act, 2000 and the cheating provisions of the IPC/BNS. "
            "Victims should report immediately to their bank and the cyber crime cell to "
            "maximise the chance of recovering funds."
        ),
        "explanation": (
            "Phishing, identity theft and online impersonation attract punishment under Sections "
            "66C and 66D of the IT Act. Cheating and misappropriation of money online attract "
            "the cheating provisions of the IPC/BNS. Acting fast matters: immediately inform "
            "your bank to block/freeze transactions, call the national helpline 1930, and file a "
            "complaint on the cyber crime reporting portal. Preserve SMS/OTP details, transaction "
            "IDs and the fraudster's details."
        ),
        "rights": [
            "Right to report the fraud and seek blocking/reversal of fraudulent transactions",
            "Right to file an FIR and a cyber crime complaint",
            "Right to seek recovery through bank/court processes",
        ],
        "next_steps": [
            "Call your bank immediately to block the card/account and report the transaction",
            "Call the national cyber fraud helpline 1930 within the first hour",
            "Report at cybercrime.gov.in and at your local police station",
            "Preserve transaction IDs, SMS/OTP records and screenshots",
            "Change passwords and enable two-factor authentication everywhere",
        ],
        "required_documents": [
            "Bank account and card details involved",
            "Transaction IDs and bank statements showing the fraudulent debit",
            "SMS/email records with OTPs or links",
            "Screenshots of the scam website/profile",
        ],
        "government_website": "https://cybercrime.gov.in",
    },
    {
        "name": "Police Complaints",
        "keywords": [
            "fir", "police", "complaint", "crime", "theft", "assault", "beaten", "cheated",
            "missing person", "arrest", "bail", "court", "charge sheet", "accused", "victim",
        ],
        "kb_act_id": None,
        "acts": [
            "Criminal Procedure Code, 1973 / Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
            "Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita (BNS), 2023",
        ],
        "summary": (
            "A person can register an FIR at any police station where the offence occurs. "
            "Section 154 CrPC (now Section 173 BNSS) requires the police to record an FIR on "
            "receiving information about a cognizable offence. If the police refuse, remedies "
            "include writing to the Superintendent of Police or approaching the Magistrate."
        ),
        "explanation": (
            "An FIR is the first written information about a cognizable offence. The police must "
            "record it free of cost and give you a signed copy. If they refuse, you can send "
            "the information in writing to the Superintendent of Police, and if that fails, "
            "approach the Magistrate who may order an investigation. Zero FIRs allow filing at "
            "any station regardless of jurisdiction. Preserve a copy of the FIR and seek legal "
            "assistance early, especially if you are an accused."
        ),
        "rights": [
            "Right to register an FIR for a cognizable offence free of cost",
            "Right to a signed copy of the FIR",
            "Right to file a complaint if police refuse (SP / Magistrate route)",
            "Right to free legal aid if in need (Article 39A, Constitution of India)",
            "Right to know the status of the investigation",
        ],
        "next_steps": [
            "Go to the nearest police station and give a written complaint with details",
            "Insist on a written FIR and obtain a signed copy with the FIR number",
            "If refused, write to the Superintendent of Police / Deputy Commissioner",
            "If still refused, file a complaint under Section 156(3) CrPC before the Magistrate",
            "Record evidence: photos, medical reports, witnesses and documents",
        ],
        "required_documents": [
            "Written complaint describing the incident with date, time, place",
            "Identification documents",
            "Evidence: photos, videos, medical records, witnesses",
            "Any previous correspondence with police (if refusal occurred)",
        ],
        "government_website": "https://www.mha.gov.in",
    },
]


def _load_json(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class LegalEngine:
    def __init__(self):
        self._acts = []
        self._sections = []
        self._acts_by_id = {}
        self._sections_by_act = {}
        self._lock = threading.Lock()
        self.vector_store = None
        self._init_vector_store()

    def _init_vector_store(self):
        """Lazily build the Chroma vector store.

        The RAG embedding dependencies (langchain-huggingface, chromadb, ...)
        are optional/heavy. If they are unavailable we log and continue with
        keyword matching instead of crashing the whole application at import.
        """
        try:
            from rag.embeddings import get_vector_store
            self.vector_store = get_vector_store(
                persist_directory=os.path.join(BASE_DIR, "rag", "chroma")
            )
        except Exception as exc:  # pragma: no cover - depends on env
            logger.warning(
                "Vector store unavailable (%s); falling back to keyword matching only.",
                exc,
            )
            self.vector_store = None

    def load(self):
        with self._lock:
            if self._acts:
                return
            self._acts = _load_json(ACTS_PATH)
            self._sections = _load_json(SECTIONS_PATH)
            self._acts_by_id = {a.get("id"): a for a in self._acts}
            self._sections_by_act = {}
            for s in self._sections:
                self._sections_by_act.setdefault(s.get("act_id"), []).append(s)

    def validate_query(self, query: str) -> bool:
        """
        Simple guardrail: check if query contains any keywords related to supported domains.
        """
        keywords = [
            "law", "legal", "police", "fir", "complaint", "harassment", "rent",
            "tenant", "cyber", "fraud", "consumer", "rights", "child", "senior",
            "maintenance", "copyright", "property", "eviction"
        ]
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in keywords)

    def detect_domain(self, query):
        q = query.lower()
        
        # 1. Keyword-based matching (existing)
        best = None
        best_score = 0
        for domain in DOMAINS:
            score = 0
            for kw in domain["keywords"]:
                if kw in q:
                    score += 1
            if score > best_score:
                best_score = score
                best = domain
        
        # 2. Vector-based similarity search (Hybrid enhancement)
        try:
            if self.vector_store is None:
                return best, best_score
            vector_results = self.vector_store.similarity_search_with_score(query, k=1)
            if vector_results:
                doc, score = vector_results[0]
                # Lower score is better in ChromaDB (distance)
                if score < 0.5:  # Threshold for similarity
                    vector_match = next((d for d in DOMAINS if d['name'] == doc.metadata['name']), None)
                    if vector_match:
                        # Combine: Favor vector if it's very similar, otherwise keyword
                        if score < 0.2:
                            return vector_match, 1.0 # High confidence
                        elif best_score < 2:
                            return vector_match, 0.8
        except Exception:
            pass # Fallback to keyword match if vector search fails
            
        return best, best_score

    def _kb_section_text(self, act_id):
        """Raw dump of every section of an act (kept for compatibility).

        Prefer `retrieve_sections` for query-relevant retrieval.
        """
        if not act_id:
            return []
        return [s.get("content", "") for s in self._sections_by_act.get(act_id, [])]

    def _kb_act(self, act_id):
        return self._acts_by_id.get(act_id)

    # --- Retrieval ---------------------------------------------------------
    STOPWORDS = frozenset({
        "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are",
        "am", "was", "were", "i", "my", "me", "we", "you", "your", "he", "she",
        "they", "them", "it", "its", "be", "been", "being", "with", "what", "how",
        "can", "could", "do", "does", "did", "if", "at", "by", "as", "that", "this",
        "from", "about", "please", "want", "need", "help", "there", "have", "has",
    })

    @classmethod
    def _tokenize(cls, text):
        if not text:
            return []
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        return [t for t in tokens if len(t) > 2 and t not in cls.STOPWORDS]

    def _act_title(self, act_id):
        act = self._acts_by_id.get(act_id) if act_id else None
        return (act or {}).get("title") or act_id

    def _act_url(self, act_id):
        act = self._acts_by_id.get(act_id) if act_id else None
        return (act or {}).get("government_link")

    def _section_source(self, section):
        act_id = section.get("act_id")
        return {
            "act_id": act_id,
            "act_title": self._act_title(act_id),
            "section_number": section.get("section_number", ""),
            "title": section.get("title", ""),
            "content": section.get("content", ""),
            "punishment": section.get("punishment", ""),
            "url": self._act_url(act_id),
        }

    def _score_sections(self, q_tokens, sections):
        scored = []
        for s in sections:
            text = " ".join((
                s.get("title", ""),
                s.get("section_number", ""),
                s.get("content", ""),
                s.get("punishment", ""),
            ))
            s_tokens = set(self._tokenize(text))
            if not s_tokens:
                continue
            overlap = len(q_tokens & s_tokens)
            if overlap:
                scored.append((overlap / (len(q_tokens) ** 0.5), s))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [s for _, s in scored]

    def _lexical_retrieve(self, query, k, act_id=None):
        """Token-overlap ranking over the sections KB (dependency-free).

        Tries the detected domain's act first, then widens to the full KB.
        """
        q_tokens = set(self._tokenize(query))
        if not q_tokens:
            return []
        if act_id:
            scoped = self._score_sections(
                q_tokens, [s for s in self._sections if s.get("act_id") == act_id]
            )[:k]
            if scoped:
                return scoped
        return self._score_sections(q_tokens, self._sections)[:k]

    def _vector_retrieve(self, query, k, act_id=None):
        """Semantic retrieval via Chroma when section embeddings exist."""
        if self.vector_store is None:
            return []
        try:
            results = self.vector_store.similarity_search_with_score(query, k=max(k * 3, 6))
        except Exception:
            return []
        out = []
        for doc, _score in results:
            meta = getattr(doc, "metadata", {}) or {}
            section_number = meta.get("section_number")
            if not section_number:
                continue  # domain-level document, not a section
            if act_id and meta.get("act_id") != act_id:
                continue
            out.append({
                "act_id": meta.get("act_id"),
                "act_title": meta.get("act_title") or self._act_title(meta.get("act_id")),
                "section_number": section_number,
                "title": meta.get("title", ""),
                "content": doc.page_content,
                "punishment": meta.get("punishment", ""),
                "url": meta.get("url") or self._act_url(meta.get("act_id")),
            })
            if len(out) >= k:
                break
        return out

    def retrieve_sections(self, query, k=3, act_id=None):
        """Return the most relevant statutory sections for `query`.

        Uses the vector store when section-level embeddings are available,
        otherwise falls back to lexical ranking so retrieval still works
        without the heavy RAG dependencies installed. When there is no
        lexical signal, falls back to the detected domain's own act.
        """
        self.load()
        hits = self._vector_retrieve(query, k, act_id)
        if hits:
            return hits
        lexical = self._lexical_retrieve(query, k, act_id)
        if lexical:
            return [self._section_source(s) for s in lexical]
        if act_id:
            return [self._section_source(s) for s in self._sections_by_act.get(act_id, [])[:k]]
        return []

    def sanitize_links_in_response(self, response_dict: dict) -> dict:
        raw_web = response_dict.get("government_website", "")
        if raw_web:
            response_dict["government_website"] = validate_url(raw_web)
        else:
            response_dict["government_website"] = FALLBACK_GOV_URL

        for key in ("explanation", "summary", "rights", "next_steps"):
            val = response_dict.get(key, "")
            if isinstance(val, str) and "http" in val:
                urls = re.findall(r"https?://[^\s<>\"']+", val)
                for u in urls:
                    cleaned_u = u.rstrip(".,;!)")
                    valid_u = validate_url(cleaned_u)
                    val = val.replace(u, valid_u)
                response_dict[key] = val

        return response_dict

    def build_response(self, query, language="en"):
        self.load()
        domain, score = self.detect_domain(query)

        if domain is None:
            return self.sanitize_links_in_response(self._generic_response(query, language))

        kb_act = self._kb_act(domain.get("kb_act_id")) if domain.get("kb_act_id") else None
        sources = self.retrieve_sections(query, k=3, act_id=domain.get("kb_act_id"))
        kb_text = [
            f"[{s['act_title']}, {s['section_number']}] "
            f"{s.get('title', '')}: {s.get('content', '')}"
            for s in sources
        ]

        act_titles = list(domain.get("acts", []))
        if kb_act:
            act_titles.insert(0, kb_act["title"])
        seen = set()
        act_titles = [t for t in act_titles if not (t in seen or seen.add(t))]

        raw_gov = (kb_act or {}).get("government_link") or domain.get("government_website", "")
        government_website = validate_url(raw_gov)

        explanation = domain["explanation"]
        if kb_text:
            explanation += "\n\nRelevant statutory provisions:\n- " + "\n- ".join(kb_text)

        confidence = round(min(0.99, 0.55 + 0.12 * score), 2)

        language_note = ""
        if language and language.lower() != "en":
            language_note = (
                f"(Answer generated in English; the knowledge base is currently available in "
                f"English. You requested: {language})"
            )

        response = {
            "summary": domain["summary"],
            "applicable_law": "; ".join(act_titles),
            "explanation": explanation + (("\n" + language_note) if language_note else ""),
            "rights": "\n".join(f"- {r}" for r in domain["rights"]),
            "next_steps": "\n".join(f"- {s}" for s in domain["next_steps"]),
            "required_documents": "\n".join(f"- {d}" for d in domain["required_documents"]),
            "government_website": government_website,
            "disclaimer": DISCLAIMER,
            "confidence_score": confidence,
            "sources": sources,
        }

        try:
            gemini = self._gemini_enhance(domain, query, language, sources)
            if gemini:
                response.update(gemini)
        except (urllib.error.URLError, KeyError, ValueError, json.JSONDecodeError):
            pass

        return self.sanitize_links_in_response(response)

    @staticmethod
    def _gemini_available():
        key = (settings.GEMINI_API_KEY or "").strip()
        return key.startswith("AIza") and "your_" not in key and "mock" not in key

    def _gemini_enhance(self, domain, query, language="en", sources=None):
        if not self._gemini_available():
            return None
        key = settings.GEMINI_API_KEY.strip()

        context_block = ""
        if sources:
            context_lines = [
                f"- {s['act_title']}, {s['section_number']} "
                f"({s.get('title', '')}): {s.get('content', '')}"
                for s in sources
            ]
            context_block = (
                "\nRetrieved statutory context (your answer MUST be grounded in this and "
                "must not invent laws or sections):\n" + "\n".join(context_lines) + "\n"
            )

        prompt = (
            "You are LegalSathi, an Indian legal information assistant. Answer the user's "
            "question using ONLY the retrieved statutory context provided below. "
            f"User query: '{query}'. Detected legal domain: '{domain['name']}'.\n"
            f"{context_block}\n"
            "Return a JSON object with exactly these keys: summary, applicable_law, explanation, "
            "rights, next_steps, required_documents, government_website, confidence_score. "
            "All values must be strings (confidence_score a float 0-1). "
            "Rights, next_steps and required_documents should be newline bullets starting with "
            "'- '. Keep it accurate and practical. "
            "CRITICAL: For every claim, cite the specific law, act and section in brackets "
            "(e.g., [Indian Penal Code, Section 302]), drawing only on the retrieved context. "
            "If the context does not cover something, state 'Source not found'. Return ONLY the JSON."
        )
        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1024},
        }).encode("utf-8")
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            "gemini-1.5-flash:generateContent?key=" + key
        )
        req = urllib.request.Request(
            url, data=payload, headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
            text = re.sub(r"\n?```$", "", text)
        parsed = json.loads(text)
        required = {
            "summary", "applicable_law", "explanation", "rights", "next_steps",
            "required_documents", "government_website", "confidence_score",
        }
        if not required.issubset(parsed.keys()):
            return None
        parsed["disclaimer"] = DISCLAIMER
        return parsed

    def _generic_response(self, query, language="en"):
        return {
            "summary": (
                "Your query did not clearly match one of the supported legal domains "
                "(Women's Rights, Children's Rights, Senior Citizen Rights, Rental Laws, "
                "Cyber Bullying, Copyright, Consumer Rights, Cyber Fraud, Police Complaints). "
                "Please rephrase with more detail about the legal issue you are facing."
            ),
            "applicable_law": "Depends on the specific facts; please specify the domain of your legal issue.",
            "explanation": (
                "For accurate guidance, please describe what happened, who is involved, and what "
                "you would like to do (e.g., file a complaint, claim maintenance, recover money)."
            ),
            "rights": "Specific rights depend on the legal domain. Please provide more details.",
            "next_steps": "- Restate your issue with the relevant legal domain\n- Describe facts, people involved and evidence\n- Mention what outcome you want",
            "required_documents": "Depends on the issue. Common documents: identity proof, agreements, receipts and correspondence.",
            "government_website": "https://www.india.gov.in",
            "disclaimer": DISCLAIMER,
            "confidence_score": 0.5,
            "sources": [],
        }


@lru_cache(maxsize=1)
def get_engine():
    engine = LegalEngine()
    engine.load()
    return engine
