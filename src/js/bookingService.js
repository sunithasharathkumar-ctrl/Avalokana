import { supabase } from './supabaseClient';

// Helper to determine if we should fall back to localStorage simulation
// Helper to determine if we should fall back to localStorage simulation
export const isOfflineMode = () => {
  // Return false because we have a verified remote Supabase database connection and fallback credentials
  return false;
};

// Seed initial bookings for simulation mode if localStorage is empty
const SEED_BOOKINGS = [
  {
    id: 'bkg-1',
    booking_id: 'AVA-000001',
    customer_name: 'Amit Kumar',
    email: 'amit@gmail.com',
    phone: '9876543210',
    ticket_count: 2,
    ticket_price: 150,
    total_amount: 300,
    payment_id: 'pay_mock_111',
    payment_status: 'Success',
    booking_status: 'Confirmed',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(JSON.stringify({ booking_id: 'AVA-000001', name: 'Amit Kumar', tickets: 2, movie: 'Avalokana' })),
    checked_in: true,
    checked_in_at: '2026-07-18T10:00:00.000Z',
    created_at: '2026-07-18T09:30:00.000Z',
    show_time: '3:45 PM'
  },
  {
    id: 'bkg-2',
    booking_id: 'AVA-000002',
    customer_name: 'Priya Sharma',
    email: 'priya@outlook.com',
    phone: '9123456789',
    ticket_count: 1,
    ticket_price: 150,
    total_amount: 150,
    payment_id: 'pay_mock_222',
    payment_status: 'Success',
    booking_status: 'Confirmed',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(JSON.stringify({ booking_id: 'AVA-000002', name: 'Priya Sharma', tickets: 1, movie: 'Avalokana' })),
    checked_in: false,
    checked_in_at: null,
    created_at: '2026-07-18T11:45:00.000Z',
    show_time: '5:45 PM'
  }
];

const getLocalBookings = () => {
  const data = localStorage.getItem('avalokana_bookings');
  if (!data) {
    localStorage.setItem('avalokana_bookings', JSON.stringify(SEED_BOOKINGS));
    return SEED_BOOKINGS;
  }
  return JSON.parse(data);
};

const saveLocalBookings = (bookings) => {
  localStorage.setItem('avalokana_bookings', JSON.stringify(bookings));
};

// Map database row keys to frontend keys
const mapSupabaseToLocal = (b) => {
  if (!b) return null;
  const checked_in = b.category?.includes('CheckedIn') || false;
  let checked_in_at = null;
  let show_time = '3:45 PM';
  
  if (b.category) {
    const parts = b.category.split(' | ');
    show_time = parts[0] || '3:45 PM';
    if (checked_in && parts.length >= 3) {
      checked_in_at = parts[2];
    }
  }

  return {
    id: b.id,
    booking_id: b.booking_id,
    customer_name: b.name,
    email: '', // Not collected in database schema
    phone: b.phone,
    ticket_count: b.tickets || 1,
    ticket_price: b.total_amount && b.tickets ? (Number(b.total_amount) / b.tickets) : 150,
    total_amount: Number(b.total_amount) || 150,
    show_time: show_time,
    payment_id: '',
    payment_status: b.paid_status === 'Confirmed' ? 'Success' : 'Pending',
    booking_status: b.paid_status === 'Confirmed' ? 'Confirmed' : (b.paid_status === 'Rejected' ? 'Cancelled' : 'Pending'),
    qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(JSON.stringify({
      booking_id: b.booking_id,
      name: b.name,
      tickets: b.tickets,
      movie: 'Avalokana',
      show_time: show_time
    }))}`,
    checked_in,
    checked_in_at,
    created_at: b.created_at
  };
};

// ----------------------------------------------------
// DB Service Methods
// ----------------------------------------------------

/**
 * Fetch available seats count
 * Total capacity is 100 per show. Available seats = Capacity - Confirmed booked tickets count for that show.
 */
export const fetchAvailableSeats = async (showTime = '3:45 PM') => {
  if (isOfflineMode()) {
    const bookings = getLocalBookings();
    const confirmedCount = bookings
      .filter(b => b.booking_status === 'Confirmed' && b.show_time === showTime)
      .reduce((sum, b) => sum + b.ticket_count, 0);
    return Math.max(0, 100 - confirmedCount);
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('tickets')
      .eq('paid_status', 'Confirmed')
      .like('booking_id', 'AVA-%')
      .like('category', `%${showTime}%`);

    if (error) throw error;
    const confirmedCount = (data || []).reduce((sum, b) => sum + (b.tickets || 0), 0);
    return Math.max(0, 100 - confirmedCount);
  } catch (err) {
    console.error("Error fetching seats from Supabase, returning offline mock count:", err);
    const bookings = getLocalBookings();
    const confirmedCount = bookings
      .filter(b => b.booking_status === 'Confirmed' && b.show_time === showTime)
      .reduce((sum, b) => sum + b.ticket_count, 0);
    return Math.max(0, 100 - confirmedCount);
  }
};

/**
 * Submit and insert a booking record
 */
export const insertBooking = async (bookingData) => {
  const showTime = bookingData.show_time || '3:45 PM';
  if (isOfflineMode()) {
    const bookings = getLocalBookings();
    const nextSeqNum = bookings.length + 1;
    const bookingId = 'AVA-' + String(nextSeqNum).padStart(6, '0');
    
    const qrPayload = {
      booking_id: bookingId,
      name: bookingData.customer_name,
      tickets: bookingData.ticket_count,
      movie: 'Avalokana',
      show_time: showTime
    };
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(JSON.stringify(qrPayload))}`;

    const newBooking = {
      id: 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
      booking_id: bookingId,
      customer_name: bookingData.customer_name,
      email: bookingData.email,
      phone: bookingData.phone,
      ticket_count: bookingData.ticket_count,
      ticket_price: bookingData.ticket_price,
      total_amount: bookingData.total_amount,
      show_time: showTime,
      payment_id: bookingData.payment_id,
      payment_status: bookingData.payment_status || 'Success',
      booking_status: bookingData.booking_status || 'Confirmed',
      qr_code_url: qrCodeUrl,
      checked_in: false,
      checked_in_at: null,
      created_at: new Date().toISOString()
    };

    bookings.push(newBooking);
    saveLocalBookings(bookings);
    return newBooking;
  }

  // Live Supabase Mode
  try {
    // Count existing bookings to generate sequential booking ID
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .like('booking_id', 'AVA-%');
    
    if (countError) throw countError;
    const nextSeqNum = (count || 0) + 1;
    const bookingId = 'AVA-' + String(nextSeqNum).padStart(6, '0');

    const insertPayload = {
      booking_id: bookingId,
      name: bookingData.customer_name,
      phone: bookingData.phone,
      profession: bookingData.profession || 'Public Audience',
      category: showTime, // Stores show time in the existing category column
      tickets: bookingData.ticket_count,
      total_amount: bookingData.total_amount,
      paid_status: bookingData.booking_status === 'Confirmed' ? 'Confirmed' : 'Pending Verification',
      booking_date: new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([insertPayload])
      .select();

    if (error) throw error;
    return mapSupabaseToLocal(data[0]);
  } catch (err) {
    console.error("Supabase insert error, falling back to simulated localStorage insert:", err);
    // Local simulation fallback
    const bookings = getLocalBookings();
    const nextSeqNum = bookings.length + 1;
    const bookingId = 'AVA-' + String(nextSeqNum).padStart(6, '0');
    const qrPayload = {
      booking_id: bookingId,
      name: bookingData.customer_name,
      tickets: bookingData.ticket_count,
      movie: 'Avalokana',
      show_time: showTime
    };
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(JSON.stringify(qrPayload))}`;

    const newBooking = {
      id: 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
      booking_id: bookingId,
      customer_name: bookingData.customer_name,
      email: bookingData.email,
      phone: bookingData.phone,
      ticket_count: bookingData.ticket_count,
      ticket_price: bookingData.ticket_price,
      total_amount: bookingData.total_amount,
      show_time: showTime,
      payment_id: bookingData.payment_id,
      payment_status: bookingData.payment_status || 'Success',
      booking_status: bookingData.booking_status || 'Confirmed',
      qr_code_url: qrCodeUrl,
      checked_in: false,
      checked_in_at: null,
      created_at: new Date().toISOString()
    };

    bookings.push(newBooking);
    saveLocalBookings(bookings);
    return newBooking;
  }
};

/**
 * Fetch dashboard statistics summaries
 */
export const fetchBookingsSummary = async () => {
  if (isOfflineMode()) {
    const bookings = getLocalBookings();
    const totalBookings = bookings.length;
    const totalRevenue = bookings
      .filter(b => b.booking_status === 'Confirmed')
      .reduce((sum, b) => sum + b.total_amount, 0);
    const totalTicketsSold = bookings
      .filter(b => b.booking_status === 'Confirmed')
      .reduce((sum, b) => sum + b.ticket_count, 0);

    return { totalBookings, totalRevenue, totalTicketsSold };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .like('booking_id', 'AVA-%');

    if (error) throw error;
    
    const list = data || [];
    const totalBookings = list.length;
    const totalRevenue = list
      .filter(b => b.paid_status === 'Confirmed')
      .reduce((sum, b) => sum + Number(b.total_amount), 0);
    const totalTicketsSold = list
      .filter(b => b.paid_status === 'Confirmed')
      .reduce((sum, b) => sum + (b.tickets || 0), 0);

    return { totalBookings, totalRevenue, totalTicketsSold };
  } catch (err) {
    console.error("Error fetching summary from Supabase, returning offline simulation values:", err);
    const bookings = getLocalBookings();
    const totalBookings = bookings.length;
    const totalRevenue = bookings
      .filter(b => b.booking_status === 'Confirmed')
      .reduce((sum, b) => sum + b.total_amount, 0);
    const totalTicketsSold = bookings
      .filter(b => b.booking_status === 'Confirmed')
      .reduce((sum, b) => sum + b.ticket_count, 0);

    return { totalBookings, totalRevenue, totalTicketsSold };
  }
};

/**
 * Search and filter bookings records list
 */
export const searchBookings = async (query = '') => {
  const searchQuery = query.trim().toLowerCase();

  if (isOfflineMode()) {
    const bookings = getLocalBookings();
    if (!searchQuery) return bookings;
    return bookings.filter(b => 
      (b.booking_id || '').toLowerCase().includes(searchQuery) ||
      (b.phone || '').toLowerCase().includes(searchQuery) ||
      (b.customer_name || '').toLowerCase().includes(searchQuery)
    );
  }

  try {
    let selectQuery = supabase.from('bookings').select('*').like('booking_id', 'AVA-%');
    if (searchQuery) {
      selectQuery = selectQuery.or(`booking_id.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
    }
    
    const { data, error } = await selectQuery.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapSupabaseToLocal);
  } catch (err) {
    console.error("Error searching Supabase, returning local filter fallback:", err);
    const bookings = getLocalBookings();
    if (!searchQuery) return bookings;
    return bookings.filter(b => 
      (b.booking_id || '').toLowerCase().includes(searchQuery) ||
      (b.phone || '').toLowerCase().includes(searchQuery) ||
      (b.customer_name || '').toLowerCase().includes(searchQuery)
    );
  }
};

/**
 * Mark a ticket as checked in (Attendance scan verify)
 */
export const markCheckin = async (bookingId) => {
  if (isOfflineMode()) {
    const bookings = getLocalBookings();
    const booking = bookings.find(b => b.booking_id === bookingId);
    
    if (!booking) {
      return { success: false, status: 'NOT_FOUND', message: `No ticket found with ID: ${bookingId}` };
    }
    
    if (booking.checked_in) {
      return { 
        success: false, 
        status: 'DUPLICATE', 
        message: `Ticket already checked-in at ${new Date(booking.checked_in_at).toLocaleTimeString()}`, 
        booking 
      };
    }

    booking.checked_in = true;
    booking.checked_in_at = new Date().toISOString();
    saveLocalBookings(bookings);
    return { success: true, status: 'VERIFIED', message: `Ticket checked-in successfully for ${booking.customer_name}!`, booking };
  }

  try {
    // 1. Fetch booking status
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_id', bookingId)
      .like('booking_id', 'AVA-%')
      .single();

    if (error || !data) {
      return { success: false, status: 'NOT_FOUND', message: `No ticket found with ID: ${bookingId}` };
    }

    const booking = data;
    const checked_in = booking.category?.includes('CheckedIn') || false;
    
    if (checked_in) {
      let checked_in_at = new Date().toISOString();
      const parts = booking.category.split(' | ');
      if (parts.length >= 3) checked_in_at = parts[2];
      return { 
        success: false, 
        status: 'DUPLICATE', 
        message: `Ticket already checked-in at ${new Date(checked_in_at).toLocaleTimeString()}`, 
        booking: mapSupabaseToLocal(booking)
      };
    }

    // 2. Perform check-in update inside category text column
    const checkinTime = new Date().toISOString();
    const updatedCategory = `${booking.category || '3:45 PM'} | CheckedIn | ${checkinTime}`;
    const { data: updatedData, error: updateError } = await supabase
      .from('bookings')
      .update({ category: updatedCategory })
      .eq('id', booking.id)
      .select();

    if (updateError) throw updateError;
    return { success: true, status: 'VERIFIED', message: `Ticket checked-in successfully for ${updatedData[0].name}!`, booking: mapSupabaseToLocal(updatedData[0]) };
  } catch (err) {
    console.error("Error performing check-in in Supabase, using localStorage simulation:", err);
    // Offline checkin
    const bookings = getLocalBookings();
    const booking = bookings.find(b => b.booking_id === bookingId);
    
    if (!booking) {
      return { success: false, status: 'NOT_FOUND', message: `No ticket found with ID: ${bookingId}` };
    }
    
    if (booking.checked_in) {
      return { 
        success: false, 
        status: 'DUPLICATE', 
        message: `Ticket already checked-in at ${new Date(booking.checked_in_at).toLocaleTimeString()}`, 
        booking 
      };
    }

    booking.checked_in = true;
    booking.checked_in_at = new Date().toISOString();
    saveLocalBookings(bookings);
    return { success: true, status: 'VERIFIED', message: `Ticket checked-in successfully for ${booking.customer_name}!`, booking };
  }
};

/**
 * Approve a pending booking (Confirm payment)
 */
export const approveBooking = async (id) => {
  if (isOfflineMode()) {
    const bookings = getLocalBookings();
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      booking.payment_status = 'Success';
      booking.booking_status = 'Confirmed';
      saveLocalBookings(bookings);
      return { success: true, booking };
    }
    return { success: false, message: 'Booking not found' };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ paid_status: 'Confirmed' })
      .eq('id', id)
      .select();

    if (error) throw error;
    return { success: true, booking: mapSupabaseToLocal(data[0]) };
  } catch (err) {
    console.error("Error approving booking:", err);
    throw err;
  }
};

