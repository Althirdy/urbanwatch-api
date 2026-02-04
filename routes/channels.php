<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Citizen private channel for receiving their own concern updates
Broadcast::channel('citizen.{citizenId}', function ($user, $citizenId) {
    // Only allow access if the user is the citizen who owns this channel
    return (int) $user->id === (int) $citizenId;
});

// Purok Leader private channel for receiving concern assignments
Broadcast::channel('purok-leader.{purokLeaderId}', function ($user, $purokLeaderId) {
    // Only allow access if the user is a purok leader (role_id = 2) and the channel matches their ID
    return (int) $user->id === (int) $purokLeaderId && (int) $user->role_id === 2;
});

// Operator private channel for receiving unassigned concerns and accidents
Broadcast::channel('operators', function ($user) {
    // Only allow access if the user is an operator (role_id = 1)
    return (int) $user->role_id === 1;
});
