<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCertificateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'event_session_id' => ['nullable', 'integer', 'exists:event_sessions,id'],
            'type' => ['required', 'in:attendance,workshop,presentation,speaker'],
            'status' => ['required', 'in:pending,issued,revoked'],
        ];
    }
}
