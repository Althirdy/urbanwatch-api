<?php

namespace App\Http\Controllers\Api\Yolo;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\Request;
use App\Services\FileUploadService;

class YoloAccidentController extends BaseApiController
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }



    private function ValidateSnapShot($file)
    {
        return true;
    }

    private function ProcessImage($file)
    {
        $filePath = $this->fileUploadService->uploadSingle($file,'yolo');
        return [
            'img' => $filePath,
            'title' => 'This is Title',
            'description' => 'This is description',
            'latitude' => '14.123456',
            'longitude' => '121.123456',
            'occured_at' => now(),
            'accident_type' => 'accident',
        ];

    }

    public function ProcessSnapShot(Request $request)
    {
        if ($request->hasFile('snapshot')) {
            if ($this->ValidateSnapShot($request->file('snapshot'))) {
                return $this->ProcessImage($request->file('snapshot'));
            }
        }

        return response()->json(['error' => 'Invalid snapshot'], 400);
    }

}
