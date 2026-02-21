<?php

namespace Tests\Unit\Requests;

use App\Http\Requests\Operator\ContactRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class ContactRequestTest extends TestCase
{
    public function test_it_accepts_custom_response_unit_name(): void
    {
        $data = [
            'branch_unit_name' => 'BFP Phase 9',
            'contact_person' => 'Responder One',
            'responder_type' => 'Fire',
            'primary_mobile' => '09171234567',
            'backup_mobile' => '09181234567',
            'active' => true,
        ];

        $validator = Validator::make($data, (new ContactRequest)->rules());

        $this->assertFalse($validator->fails(), 'Expected custom response unit to pass validation.');
    }

    public function test_it_rejects_invalid_responder_type(): void
    {
        $data = [
            'branch_unit_name' => 'BFP',
            'contact_person' => 'Responder Two',
            'responder_type' => 'Medical',
            'primary_mobile' => '09171234567',
            'active' => true,
        ];

        $validator = Validator::make($data, (new ContactRequest)->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('responder_type', $validator->errors()->toArray());
    }
}
