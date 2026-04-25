"""
Predefined sentences for dyslexia handwriting screening.
Selected to contain reversible letters (b,d,p,q,n,u,m,w).
"""

import random

SCREENING_SENTENCES = [
    "the big dog can jump",
    "a bad pen dropped down",
    "put the cup on the desk",
    "the puppy dug under the bed",
    "quick brown dogs jump up",
]


def get_random_sentence() -> str:
    """Return randomly selected screening sentence."""
    return random.choice(SCREENING_SENTENCES)


def get_all_sentences() -> list[str]:
    """Return all available screening sentences."""
    return SCREENING_SENTENCES.copy()
