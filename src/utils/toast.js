import toast from 'react-hot-toast';

const toastStyle = {
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

const errorStyle = {
    ...toastStyle,
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
};

const successStyle = {
    ...toastStyle,
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
};

const loadingStyle = {
    ...toastStyle,
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
};

export const showError = (message) => {
    toast.error(message, {
        duration: 4000,
        icon: '❌',
        style: errorStyle,
    });
};

export const showSuccess = (message) => {
    toast.success(message, {
        duration: 3000,
        icon: '✅',
        style: successStyle,
    });
};

export const showLoading = (message) => {
    return toast.loading(message, {
        style: loadingStyle,
    });
};

export default toast;
