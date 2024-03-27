class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something in the way",
        errors = [],
        statck = ""
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.success = false
        this.message = message
        this.errors = errors

        // Stack Trace Likhenge ki developer ko pata chal jaye statck mai kaha dikkat aa rahi
        if (statck) {
            this.stack = statck
        } else {
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export { ApiError }