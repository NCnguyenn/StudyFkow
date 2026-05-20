class ActiveSessionExistsError(Exception):
    """
    Raised by the service layer when a user attempts to start a new session
    while already having a session in ACTIVE or PAUSED state.

    Mapped to HTTP 400 with error code ACTIVE_SESSION_EXISTS.
    """
    def __init__(self, existing_session_id: str) -> None:
        self.existing_session_id = existing_session_id
        super().__init__(
            f"User already has an active or paused session: {existing_session_id}"
        )


class SessionNotActiveError(Exception):
    """
    Raised when a heartbeat or state transition is attempted on a session
    that is in a terminal state (COMPLETED, INTERRUPTED, ERROR).

    Mapped to HTTP 409 with error code SESSION_NOT_ACTIVE.
    """
    def __init__(self, session_id: str, current_status: str) -> None:
        self.session_id = session_id
        self.current_status = current_status
        super().__init__(
            f"Session {session_id} is in terminal state '{current_status}' "
            "and cannot accept heartbeats."
        )


class SessionNotFoundError(Exception):
    """
    Raised when a session lookup returns no result (either non-existent
    or soft-deleted).

    Mapped to HTTP 404.
    """
    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        super().__init__(f"Session not found: {session_id}")


class SessionNotPausedError(Exception):
    """
    Raised when a resume is attempted on a session that is NOT in PAUSED state.

    Mapped to HTTP 409 with error code SESSION_NOT_PAUSED.
    """
    def __init__(self, session_id: str, current_status: str) -> None:
        self.session_id = session_id
        self.current_status = current_status
        super().__init__(
            f"Session {session_id} is in state '{current_status}' and "
            "cannot be resumed. Only PAUSED sessions can be resumed."
        )


class SessionAlreadyEndedError(Exception):
    """
    Raised when pause, resume, or end is attempted on a COMPLETED session.

    Mapped to HTTP 409 with error code SESSION_ALREADY_ENDED.
    """
    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        super().__init__(
            f"Session {session_id} is already COMPLETED and is immutable."
        )
