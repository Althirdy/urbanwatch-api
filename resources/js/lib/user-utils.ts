import { users_T } from '@/types/user-types';

export const getInitials = (user: users_T) => {
    let firstName = '';
    let lastName = '';

    if (user.official_details) {
        firstName = user.official_details.first_name;
        lastName = user.official_details.last_name;
    } else if (user.citizen_details) {
        firstName = user.citizen_details.first_name;
        lastName = user.citizen_details.last_name;
    } else {
        const nameParts = user.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts[nameParts.length - 1] || '';
    }

    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
};

export const getUserFullName = (user: users_T) => {
    if (user.official_details) {
        return `${user.official_details.first_name} ${user.official_details.middle_name ? user.official_details.middle_name + ' ' : ''}${user.official_details.last_name}`;
    } else if (user.citizen_details) {
        return `${user.citizen_details.first_name} ${user.citizen_details.middle_name ? user.citizen_details.middle_name + ' ' : ''}${user.citizen_details.last_name}`;
    }
    return user.name;
};

export const getUserPhoneNumber = (user: users_T) => {
    if (user.official_details) {
        return user.official_details.contact_number || 'N/A';
    } else if (user.citizen_details) {
        return user.citizen_details.phone_number || 'N/A';
    }
    return 'N/A';
};

export const getUserBarangay = (user: users_T) => {
    if (user.official_details) {
        return user.official_details.assigned_brgy || 'N/A';
    } else if (user.citizen_details) {
        return user.citizen_details.barangay || 'N/A';
    }
    return 'N/A';
};

export const extractUserFormData = (user: users_T) => {
    const details = user.official_details || user.citizen_details;

    return {
        first_name: details?.first_name || '',
        middle_name: details?.middle_name || '',
        last_name: details?.last_name || '',
        suffix: details?.suffix || '',
        email: user.email || '',
        phone_number:
            user.official_details?.contact_number ||
            user.citizen_details?.phone_number ||
            '',
        role_id: user.role?.id?.toString() || '',
        status: user.status || 'Active',
        date_of_birth: user.citizen_details?.date_of_birth || '',
        address: user.citizen_details?.address || '',
        barangay:
            user.citizen_details?.barangay ||
            user.official_details?.assigned_brgy ||
            '',
        city: user.citizen_details?.city || '',
        province: user.citizen_details?.province || '',
        postal_code: user.citizen_details?.postal_code || '',
        is_verified: user.citizen_details?.is_verified || false,
        office_address: user.official_details?.office_address || '',
        assigned_brgy: user.official_details?.assigned_brgy || '',
        latitude: user.official_details?.latitude || '',
        longitude: user.official_details?.longitude || '',
    };
};
