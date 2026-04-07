<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTripItineraryRequest;
use App\Models\Trip;
use Illuminate\Http\RedirectResponse;

class TripItineraryController extends Controller
{
    public function store(StoreTripItineraryRequest $request, Trip $trip): RedirectResponse
    {
        $this->authorize('addItinerary', $trip);

        $trip->itineraries()->create([
            'created_by_user_id' => $request->user()->id,
            'title' => $request->validated('title'),
            'scheduled_for' => $request->validated('scheduled_for'),
            'notes' => $request->validated('notes'),
        ]);

        return back();
    }
}
