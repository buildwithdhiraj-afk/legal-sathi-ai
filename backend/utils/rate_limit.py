"""Central rate limiter (slowapi).

The limiter is keyed on client IP by default. Auth and chat endpoints apply
stricter per-route limits via the @limiter.limit(...) decorator.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from config.settings import settings


def _client_key(request):
    return get_remote_address(request)


limiter = Limiter(key_func=_client_key)
# Honour the feature flag; slowapi checks this attribute before enforcing.
limiter.enabled = settings.RATE_LIMIT_ENABLED
