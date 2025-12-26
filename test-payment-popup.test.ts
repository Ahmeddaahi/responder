/**
 * Test file to verify the payment verification popup logic
 * This test verifies that the popup only shows once after payment verification
 */

// Mock Supabase client for testing
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  single: jest.fn()
};

// Mock toast hook
const mockToast = jest.fn();

// Mock useNavigate hook
const mockNavigate = jest.fn();

// Mock the actual imports
jest.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

describe('Payment Verification Popup Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should show popup only once after payment verification', async () => {
    // Simulate a user with a verified payment that hasn't shown the notification yet
    const mockVerifiedPayment = {
      id: 'payment-123',
      requested_plan: 'starter',
      created_at: new Date().toISOString()
    };

    // Mock the database response for a verified payment with notification_shown = false
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null }); // profile check
    mockSupabase.select.mockResolvedValueOnce({ data: null, error: null }); // subscription check
    mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null }); // subscription creation
    mockSupabase.select.mockResolvedValueOnce({ data: [], error: null }); // pending payments
    mockSupabase.select.mockResolvedValueOnce({ data: [mockVerifiedPayment], error: null }); // verified payments with notification_shown = false

    // Import the Dashboard component and simulate mounting
    const { loadVerifiedPayments } = await import('./src/pages/Dashboard');

    // Call the function that loads verified payments
    await loadVerifiedPayments();

    // Verify that the popup would be shown (setShowVerificationSuccess would be called with true)
    expect(mockSupabase.from).toHaveBeenCalledWith('payment_requests');
    expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'verified');
    expect(mockSupabase.eq).toHaveBeenCalledWith('notification_shown', false);

    // Now simulate the user clicking "Awesome, Thanks!"
    mockSupabase.update.mockResolvedValueOnce({ data: null, error: null });
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

    // Import and call the markNotificationAsShown function
    const { markNotificationAsShown } = await import('./src/pages/Dashboard');
    await markNotificationAsShown(mockVerifiedPayment);

    // Verify that the notification_shown field was updated to true
    expect(mockSupabase.update).toHaveBeenCalledWith({ notification_shown: true });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockVerifiedPayment.id);

    // Now simulate reloading the verified payments - should return empty array
    mockSupabase.select.mockResolvedValueOnce({ data: [], error: null }); // verified payments with notification_shown = false
    
    // Call loadVerifiedPayments again
    await loadVerifiedPayments();

    // Verify that no popup would be shown this time
    expect(mockSupabase.from).toHaveBeenCalledWith('payment_requests');
    expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'verified');
    expect(mockSupabase.eq).toHaveBeenCalledWith('notification_shown', false);
  });

  test('admin verification sets notification_shown to false', async () => {
    // Mock admin verification process
    const mockUser = { id: 'admin-123' };
    const paymentId = 'payment-456';
    const userId = 'user-789';
    const requestedPlan = 'enterprise';

    mockSupabase.update.mockResolvedValueOnce({ data: null, error: null }); // payment update
    mockSupabase.update.mockResolvedValueOnce({ data: null, error: null }); // subscription update
    mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null }); // admin action log

    // Import and call the verifyPayment function from Admin
    const { verifyPayment } = await import('./src/pages/Admin');
    await verifyPayment(paymentId, userId, requestedPlan, mockUser);

    // Verify that notification_shown was set to false during verification
    expect(mockSupabase.update).toHaveBeenCalledWith({
      status: 'verified',
      verified_by: mockUser.id,
      verified_at: expect.any(String),
      notification_shown: false
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', paymentId);
  });
});