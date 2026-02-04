<?php

namespace App\Exceptions;

use Exception;

class UrbanWatchException extends Exception
{
    protected array $extraData = [];

    public function __construct(string $message = '', int $code = 400, array $extraData = [], ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->extraData = $extraData;
    }

    public function render($request)
    {
        $response = [
            'success' => false,
            'message' => $this->getMessage(),
        ];

        // Merge extra data (like lock_type, seconds) into the response
        if (! empty($this->extraData)) {
            $response = array_merge($response, $this->extraData);
        }

        return response()->json($response, $this->getCode() ?: 400);
    }
}
