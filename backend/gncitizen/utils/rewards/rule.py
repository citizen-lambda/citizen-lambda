from typing import Callable
from gncitizen.utils.rewards.fact import Fact


class Rule:
    def __init__(self, condition_fn: Callable, action_fn: Callable):
        self.condition = condition_fn  # When condition met
        self.action = action_fn  # Then assign category badge

    def matches(self, fact: Fact) -> bool:
        return bool(self.condition(fact))
