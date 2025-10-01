/**
 * Blood Request Management JavaScript
 * Handles CRUD operations for blood requests
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const createRequestBtn = document.getElementById('createRequestBtn');
    const createRequestForm = document.getElementById('createRequestForm');
    const editRequestForm = document.getElementById('editRequestForm');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const requestsTableBody = document.getElementById('requestsTableBody');
    const noRequestsRow = document.getElementById('noRequestsRow');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const successAlert = document.getElementById('successAlert');
    const successMessage = document.getElementById('successMessage');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');

    // Get userId from localStorage
    const userId = localStorage.getItem('normalUserId');

    // Redirect to login if userId is not available


    // Load user's requests
    loadUserRequests();

    // Event Listeners
    createRequestBtn.addEventListener('click', () => toggleCreateModal(true));
    createRequestForm.addEventListener('submit', handleCreateRequest);
    editRequestForm.addEventListener('submit', handleEditRequest);
    confirmDeleteBtn.addEventListener('click', handleDeleteRequest);

    /**
     * Load user's blood requests
     */
    function loadUserRequests() {
        showLoading(true);

        fetch(`/api/requests/user/${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load requests');
                }
                return response.json();
            })
            .then(requests => {
                showLoading(false);
                displayRequests(requests);
            })
            .catch(error => {
                showLoading(false);
                showError('Failed to load requests: ' + error.message);
            });
    }

    /**
     * Display requests in the table
     * @param {Array} requests - Array of request objects
     */
    function displayRequests(requests) {
        // Clear existing rows except the "no requests" row
        const rows = requestsTableBody.querySelectorAll('tr:not(#noRequestsRow)');
        rows.forEach(row => row.remove());

        if (requests.length === 0) {
            noRequestsRow.classList.remove('hidden');
            return;
        }

        noRequestsRow.classList.add('hidden');

        requests.forEach(request => {
            const row = document.createElement('tr');

            // Format date
            const createdDate = new Date(request.createdAt);
            const formattedDate = createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString();

            // Determine if actions should be enabled (only for Pending status)
            const isPending = request.status === 'Pending';

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.bloodType}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.units}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.urgency}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${getStatusClass(request.status)}">
                        ${request.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-3 ${isPending ? '' : 'opacity-50 cursor-not-allowed'}" 
                        ${isPending ? `onclick="openEditModal(${JSON.stringify(request).replace(/"/g, '&quot;')})"` : 'disabled'}>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900 ${isPending ? '' : 'opacity-50 cursor-not-allowed'}" 
                        ${isPending ? `onclick="openDeleteModal(${request.id})"` : 'disabled'}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            requestsTableBody.appendChild(row);
        });
    }

    /**
     * Get CSS class for status badge
     * @param {string} status - Request status
     * @returns {string} CSS class
     */
    function getStatusClass(status) {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Approved':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            case 'Completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    /**
     * Handle create request form submission
     * @param {Event} event - Form submit event
     */
    function handleCreateRequest(event) {
        event.preventDefault();

        if (!validateCreateForm()) {
            return;
        }

        const formData = new FormData(createRequestForm);
        const requestData = {
            userId: parseInt(userId),
            bloodType: formData.get('bloodType'),
            units: parseInt(formData.get('units')),
            urgency: formData.get('urgency'),
            status: formData.get('status')
        };

        showLoading(true);

        fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create request');
                }
                return response.json();
            })
            .then(() => {
                showLoading(false);
                toggleCreateModal(false);
                createRequestForm.reset();
                showSuccess('Blood request created successfully');
                loadUserRequests();
            })
            .catch(error => {
                showLoading(false);
                showError('Failed to create request: ' + error.message);
            });
    }

    /**
     * Handle edit request form submission
     * @param {Event} event - Form submit event
     */
    function handleEditRequest(event) {
        event.preventDefault();

        if (!validateEditForm()) {
            return;
        }

        const formData = new FormData(editRequestForm);
        const requestId = formData.get('id');
        const requestData = {
            userId: parseInt(userId),
            bloodType: formData.get('bloodType'),
            units: parseInt(formData.get('units')),
            urgency: formData.get('urgency'),
            status: formData.get('status')
        };

        showLoading(true);

        fetch(`/api/requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update request');
                }
                return response.json();
            })
            .then(() => {
                showLoading(false);
                toggleEditModal(false);
                showSuccess('Blood request updated successfully');
                loadUserRequests();
            })
            .catch(error => {
                showLoading(false);
                showError('Failed to update request: ' + error.message);
            });
    }

    /**
     * Handle delete request
     */
    function handleDeleteRequest() {
        const requestId = document.getElementById('deleteRequestId').value;

        showLoading(true);

        fetch(`/api/requests/${requestId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete request');
                }
                return response.text();
            })
            .then(() => {
                showLoading(false);
                toggleDeleteModal(false);
                showSuccess('Blood request deleted successfully');
                loadUserRequests();
            })
            .catch(error => {
                showLoading(false);
                showError('Failed to delete request: ' + error.message);
            });
    }

    /**
     * Validate create request form
     * @returns {boolean} True if valid, false otherwise
     */
    function validateCreateForm() {
        let isValid = true;

        // Blood Type validation
        const bloodType = document.getElementById('createBloodType').value;
        const bloodTypeError = document.getElementById('createBloodTypeError');
        if (!bloodType) {
            bloodTypeError.classList.remove('hidden');
            isValid = false;
        } else {
            bloodTypeError.classList.add('hidden');
        }

        // Units validation
        const units = document.getElementById('createUnits').value;
        const unitsError = document.getElementById('createUnitsError');
        if (!units || isNaN(units) || units < 1 || units > 10) {
            unitsError.classList.remove('hidden');
            isValid = false;
        } else {
            unitsError.classList.add('hidden');
        }

        // Urgency validation
        const urgency = document.getElementById('createUrgency').value;
        const urgencyError = document.getElementById('createUrgencyError');
        if (!urgency) {
            urgencyError.classList.remove('hidden');
            isValid = false;
        } else {
            urgencyError.classList.add('hidden');
        }

        return isValid;
    }

    /**
     * Validate edit request form
     * @returns {boolean} True if valid, false otherwise
     */
    function validateEditForm() {
        let isValid = true;

        // Blood Type validation
        const bloodType = document.getElementById('editBloodType').value;
        const bloodTypeError = document.getElementById('editBloodTypeError');
        if (!bloodType) {
            bloodTypeError.classList.remove('hidden');
            isValid = false;
        } else {
            bloodTypeError.classList.add('hidden');
        }

        // Units validation
        const units = document.getElementById('editUnits').value;
        const unitsError = document.getElementById('editUnitsError');
        if (!units || isNaN(units) || units < 1 || units > 10) {
            unitsError.classList.remove('hidden');
            isValid = false;
        } else {
            unitsError.classList.add('hidden');
        }

        // Urgency validation
        const urgency = document.getElementById('editUrgency').value;
        const urgencyError = document.getElementById('editUrgencyError');
        if (!urgency) {
            urgencyError.classList.remove('hidden');
            isValid = false;
        } else {
            urgencyError.classList.add('hidden');
        }

        return isValid;
    }
});

/**
 * Toggle create request modal
 * @param {boolean} show - Whether to show or hide the modal
 */
function toggleCreateModal(show) {
    const modal = document.getElementById('createRequestModal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

/**
 * Toggle edit request modal
 * @param {boolean} show - Whether to show or hide the modal
 */
function toggleEditModal(show) {
    const modal = document.getElementById('editRequestModal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

/**
 * Toggle delete confirmation modal
 * @param {boolean} show - Whether to show or hide the modal
 */
function toggleDeleteModal(show) {
    const modal = document.getElementById('deleteConfirmModal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

/**
 * Open edit modal with request data
 * @param {Object} request - Request object
 */
function openEditModal(request) {
    document.getElementById('editRequestId').value = request.id;
    document.getElementById('editBloodType').value = request.bloodType;
    document.getElementById('editUnits').value = request.units;
    document.getElementById('editUrgency').value = request.urgency;
    document.getElementById('editStatus').value = request.status;

    toggleEditModal(true);
}

/**
 * Open delete confirmation modal
 * @param {number} requestId - Request ID
 */
function openDeleteModal(requestId) {
    document.getElementById('deleteRequestId').value = requestId;
    toggleDeleteModal(true);
}

/**
 * Show loading spinner
 * @param {boolean} show - Whether to show or hide the spinner
 */
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

/**
 * Show success alert
 * @param {string} message - Success message
 */
function showSuccess(message) {
    const successAlert = document.getElementById('successAlert');
    const successMessage = document.getElementById('successMessage');

    successMessage.textContent = message;
    successAlert.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        successAlert.classList.add('hidden');
    }, 5000);
}

/**
 * Show error alert
 * @param {string} message - Error message
 */
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = message;
    errorAlert.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorAlert.classList.add('hidden');
    }, 5000);
}