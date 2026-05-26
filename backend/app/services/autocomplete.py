import re
from typing import List

FINANCIAL_TERMS = [
    "revenue", "net income", "gross profit", "operating margin", "ebitda",
    "cash flow", "free cash flow", "earnings per share", "diluted eps",
    "return on equity", "return on assets", "debt to equity", "current ratio",
    "quick ratio", "asset turnover", "inventory turnover", "days sales outstanding",
    "working capital", "capital expenditure", "capex", "depreciation",
    "amortization", "goodwill", "intangible assets", "accounts receivable",
    "accounts payable", "accrued expenses", "deferred revenue", "shareholders equity",
    "common stock", "treasury stock", "retained earnings", "operating expenses",
    "selling general and administrative", "research and development", "cost of goods sold",
    "gross margin", "operating income", "pre tax income", "income tax expense",
    "effective tax rate", "diluted shares", "basic eps", "weighted average shares",
    "segment reporting", "geographic revenue", "product revenue", "service revenue",
    "subscription revenue", "annual recurring revenue", "arr", "mrr",
    "churn rate", "customer acquisition cost", "cac", "lifetime value", "ltv",
    "gaap", "non gaap", "sec filing", "10-k", "10-q", "8-k",
    "risk factors", "management discussion", "financial statements",
    "balance sheet", "income statement", "cash flow statement",
    "notes to financial statements", "audit report", "internal controls",
    "discontinued operations", "extraordinary items", "accounting policy",
    "revenue recognition", "stock based compensation", "restructuring charge",
    "impairment", "write down", "goodwill impairment",
    "market risk", "credit risk", "liquidity risk", "interest rate risk",
    "foreign exchange risk", "derivative instruments", "hedging activities",
    "fair value measurement", "related party transactions", "commitments and contingencies",
    "legal proceedings", "dividend policy", "share repurchase", "stock buyback",
    "insider trading", "executive compensation", "board of directors",
    "corporate governance", "internal control over financial reporting",
    "disclosure controls", "sarbanes oxley", "pension plan", "postretirement benefits",
    "operating lease", "finance lease", "debt covenant", "credit facility",
    "senior notes", "convertible debt", "interest expense", "weighted average cost of capital",
    "wacc", "net present value", "npv", "internal rate of return", "irr",
    "comparable company analysis", "precedent transaction", "discounted cash flow",
    "dcf", "leverage", "liquidity", "solvency", "profitability ratio",
    "price to earnings", "p/e ratio", "price to book", "p/b ratio",
    "enterprise value", "ev/ebitda", "dividend yield", "payout ratio",
    "beta", "alpha", "sharpe ratio", "standard deviation", "volatility",
    "market capitalization", "total shareholder return", "same store sales",
    "comparable sales", "organic growth", "acquisition", "divestiture",
    "spin off", "initial public offering", "ipo", "secondary offering",
]

POPULAR_QUERIES = [
    "revenue growth 2024",
    "net income trend",
    "risk factors",
    "competition",
    "market share",
]

PREFIXES = ["what is", "how did", "why did", "show me", "compare"]


class AutocompleteService:
    def __init__(self):
        self.past_queries: List[str] = []
        self.trigram_index: dict[str, set[int]] = {}
        self._rebuild_index()

    def _rebuild_index(self):
        self.trigram_index.clear()
        all_terms = FINANCIAL_TERMS + POPULAR_QUERIES + PREFIXES + self.past_queries
        for idx, term in enumerate(all_terms):
            normalized = term.lower()
            trigrams = self._extract_trigrams(normalized)
            for trigram in trigrams:
                if trigram not in self.trigram_index:
                    self.trigram_index[trigram] = set()
                self.trigram_index[trigram].add(idx)

    def _extract_trigrams(self, text: str) -> List[str]:
        return [text[i:i+3] for i in range(len(text) - 2)]

    def add_query(self, query: str):
        self.past_queries.append(query)
        self._rebuild_index()

    def suggest(self, partial: str, max_results: int = 5) -> List[str]:
        if not partial or len(partial.strip()) < 2:
            return POPULAR_QUERIES[:max_results]

        partial = partial.strip().lower()
        query_trigrams = self._extract_trigrams(partial)

        all_terms = FINANCIAL_TERMS + POPULAR_QUERIES + PREFIXES + self.past_queries
        all_terms_set = list(dict.fromkeys(all_terms))

        scored = []
        for term in all_terms_set:
            term_lower = term.lower()
            if term_lower.startswith(partial):
                scored.append((term, 100))
                continue
            if partial in term_lower:
                scored.append((term, 50))
                continue
            term_trigrams = self._extract_trigrams(term_lower)
            overlap = len(set(query_trigrams) & set(term_trigrams))
            if overlap > 0:
                scored.append((term, overlap))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [term for term, score in scored[:max_results]]


autocomplete_service = AutocompleteService()