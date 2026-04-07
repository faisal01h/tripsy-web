<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripItineraryRequest;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;

class TripItineraryController extends Controller
{
    public function store(StoreTripItineraryRequest $request, Trip $trip): JsonResponse
    {
        $this->authorize('addItinerary', $trip);

        $itinerary = $trip->itineraries()->create([
            'created_by_user_id' => $request->user()->id,
            'title' => $request->validated('title'),
            'scheduled_for' => $request->validated('scheduled_for'),
            'notes' => $request->validated('notes'),
        ]);

        return response()->json([
            'message' => 'Itinerary created successfully.',
            'itinerary' => [
                'id' => $itinerary->id,
                'trip_id' => $itinerary->trip_id,
                'title' => $itinerary->title,
                'scheduled_for' => $itinerary->scheduled_for?->toIso8601String(),
                'notes' => $itinerary->notes,
                'created_by_user_id' => $itinerary->created_by_user_id,
            ],
        ], 201);
    }
}
