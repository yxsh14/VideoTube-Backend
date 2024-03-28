class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something in the way",
        errors = [],
        stack = ""
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.success = false
        this.message = message
        this.errors = errors

        // Stack Trace Likhenge ki developer ko pata chal jaye statck mai kaha dikkat aa rahi
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export { ApiError }