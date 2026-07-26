import { fetchAvailableSeats, insertBooking, searchBookings, fetchBookingsSummary, isOfflineMode, approveBooking } from './bookingService';
import { supabase } from './supabaseClient';

document.addEventListener('DOMContentLoaded', () => {
  
  // ----------------------------------------------------
  // 1. Scroll Effects & Navigation
  // ----------------------------------------------------
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const links = document.querySelectorAll('.nav-link');

  // Sticky Navbar with blur
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
  });

  // Close mobile menu on link click
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      navToggle.classList.remove('active');
    });
  });

  // Scroll Reveal Animations
  const revealElements = document.querySelectorAll('.reveal');
  const revealOnScroll = () => {
    const triggerBottom = window.innerHeight * 0.85;
    revealElements.forEach(el => {
      const elTop = el.getBoundingClientRect().top;
      if (elTop < triggerBottom) {
        el.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Initial check

  // ----------------------------------------------------
  // 2. Quotes Carousel
  // ----------------------------------------------------
  const quotes = document.querySelectorAll('.quote-slide');
  let currentQuoteIndex = 0;

  const rotateQuotes = () => {
    if (quotes.length > 0) {
      quotes[currentQuoteIndex].classList.remove('active');
      currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
      quotes[currentQuoteIndex].classList.add('active');
    }
  };

  if (quotes.length > 0) {
    setInterval(rotateQuotes, 6000);
  }

  // ----------------------------------------------------
  // 3. Interactive Trailer Modal (YouTube Player Overlay)
  // ----------------------------------------------------
  const playBtn = document.getElementById('playBtn');
  const trailerModal = document.getElementById('trailerModal');
  const closeTrailerBtn = document.getElementById('closeTrailerBtn');

  const playTrailer = () => {
    const trailerVideoContainer = document.getElementById('trailerVideoContainer');
    if (trailerVideoContainer) {
      trailerVideoContainer.style.display = 'block';
      trailerVideoContainer.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/7rAZFsuFvDs?autoplay=1&enablejsapi=1" title="Avalokana Trailer" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="border: none;"></iframe>`;
    }
    const trailerCanvas = document.getElementById('trailerCanvas');
    if (trailerCanvas) trailerCanvas.style.display = 'none';
    
    const soundtrackInfo = document.querySelector('.trailer-soundtrack-info');
    if (soundtrackInfo) soundtrackInfo.style.display = 'none';
    
    const subtitles = document.getElementById('subtitles');
    if (subtitles) subtitles.style.display = 'none';
    
    const controls = document.querySelector('.trailer-controls');
    if (controls) controls.style.display = 'none';
    
    const progressContainer = document.getElementById('progressBarContainer');
    if (progressContainer) progressContainer.style.display = 'none';
  };

  const pauseTrailer = () => {
    const trailerVideoContainer = document.getElementById('trailerVideoContainer');
    if (trailerVideoContainer) {
      trailerVideoContainer.innerHTML = '';
      trailerVideoContainer.style.display = 'none';
    }
    const trailerCanvas = document.getElementById('trailerCanvas');
    if (trailerCanvas) trailerCanvas.style.display = 'block';
    
    const soundtrackInfo = document.querySelector('.trailer-soundtrack-info');
    if (soundtrackInfo) soundtrackInfo.style.display = 'flex';
    
    const controls = document.querySelector('.trailer-controls');
    if (controls) controls.style.display = 'flex';
    
    const progressContainer = document.getElementById('progressBarContainer');
    if (progressContainer) progressContainer.style.display = 'block';
  };

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (trailerModal) {
        trailerModal.classList.add('active');
        playTrailer();
      }
    });
  }

  const closeTrailer = () => {
    if (trailerModal) {
      trailerModal.classList.remove('active');
      pauseTrailer();
    }
  };

  if (closeTrailerBtn) {
    closeTrailerBtn.addEventListener('click', closeTrailer);
  }
  
  if (trailerModal) {
    trailerModal.addEventListener('click', (e) => {
      if (e.target === trailerModal) {
        closeTrailer();
      }
    });
  }

  // ----------------------------------------------------
  // 4. Ticket Booking Interactive Form & calculations
  // ----------------------------------------------------
  const availableSeatsDisplay = document.getElementById('availableSeatsDisplay');
  const btnBookMinus = document.getElementById('btnBookMinus');
  const btnBookPlus = document.getElementById('btnBookPlus');
  const bookingQtyValue = document.getElementById('bookingQtyValue');
  const summaryTicketsCount = document.getElementById('summaryTicketsCount');
  const summaryTotalAmount = document.getElementById('summaryTotalAmount');
  const btnTriggerPayment = document.getElementById('btnTriggerPayment');

  const bookingDetailsForm = document.getElementById('bookingDetailsForm');
  const bookingName = document.getElementById('bookingName');
  const bookingPhone = document.getElementById('bookingPhone');
  const bookingShowTime = document.getElementById('bookingShowTime');
  const audienceCategoryRadios = document.querySelectorAll('input[name="audienceCategory"]');
  const professionContainer = document.getElementById('professionContainer');
  const bookingProfession = document.getElementById('bookingProfession');

  const TICKET_PRICE = 150; // configurable ticket price
  let quantity = 1;

  const updateCategoryStyles = () => {
    document.querySelectorAll('.category-radio-label').forEach(label => {
      const radio = label.querySelector('input[type="radio"]');
      if (radio && radio.checked) {
        label.style.borderColor = 'var(--accent-gold)';
        label.style.background = 'rgba(212, 175, 55, 0.08)';
      } else if (label) {
        label.style.borderColor = 'rgba(212, 175, 55, 0.25)';
        label.style.background = 'rgba(255,255,255,0.02)';
      }
    });
  };

  if (audienceCategoryRadios && audienceCategoryRadios.length > 0) {
    audienceCategoryRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        updateCategoryStyles();
        if (professionContainer) {
          if (e.target.value === 'Film Maker') {
            professionContainer.style.display = 'flex';
          } else {
            professionContainer.style.display = 'none';
          }
        }
      });
    });
    updateCategoryStyles();
  }
  let availableSeats = 100;

  // Refresh available seats count
  const refreshSeats = async () => {
    try {
      const selectedShow = bookingShowTime ? bookingShowTime.value : '3:45 PM';
      availableSeats = await fetchAvailableSeats(selectedShow);
      availableSeatsDisplay.textContent = `${availableSeats} / 100`;
      
      if (availableSeats <= 0) {
        availableSeatsDisplay.style.color = '#ff3344';
        btnTriggerPayment.disabled = true;
        btnTriggerPayment.textContent = "Sold Out";
      } else {
        availableSeatsDisplay.style.color = 'var(--accent-gold)';
        btnTriggerPayment.disabled = false;
        btnTriggerPayment.textContent = "Proceed to Payment";
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (bookingShowTime) {
    bookingShowTime.addEventListener('change', () => {
      const selectedShow = bookingShowTime.value;
      const summaryDateTime = document.getElementById('summaryDateTime');
      if (summaryDateTime) {
        summaryDateTime.innerHTML = `Sunday, August 2nd, 2026<br><span style="font-size:0.8rem; color: var(--accent-gold);">${selectedShow === '3:45 PM' ? '3:45 PM (1st Show)' : '5:45 PM (2nd Show)'}</span>`;
      }
      refreshSeats();
    });
  }

  refreshSeats();

  // Quantity updates
  const updateSummary = () => {
    bookingQtyValue.textContent = quantity;
    summaryTicketsCount.textContent = `${quantity} Ticket${quantity > 1 ? 's' : ''}`;
    summaryTotalAmount.textContent = `₹${quantity * TICKET_PRICE}`;
  };

  btnBookMinus.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      updateSummary();
    }
  });

  btnBookPlus.addEventListener('click', () => {
    if (quantity < availableSeats) {
      quantity++;
      updateSummary();
    } else {
      alert(`Only ${availableSeats} tickets remaining.`);
    }
  });

  // ----------------------------------------------------
  // 5. Checkout simulated Razorpay Overlay triggers
  // ----------------------------------------------------
  const paymentCheckoutModal = document.getElementById('paymentCheckoutModal');
  const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
  const checkoutPayingAmount = document.getElementById('checkoutPayingAmount');
  const checkoutOrderId = document.getElementById('checkoutOrderId');
  const btnExecutePayment = document.getElementById('btnExecutePayment');
  const paymentLoadingSpinner = document.getElementById('paymentLoadingSpinner');
  const paymentOptionsContainer = document.getElementById('paymentOptionsContainer');

  const cardDetailsContainer = document.getElementById('cardDetailsContainer');
  const upiScannerDetailsContainer = document.getElementById('upiScannerDetailsContainer');

  btnTriggerPayment.addEventListener('click', () => {
    // Validate inputs programmatically
    if (!bookingDetailsForm.checkValidity()) {
      bookingDetailsForm.reportValidity();
      return;
    }

    // Prepare order details
    checkoutPayingAmount.textContent = `₹${quantity * TICKET_PRICE}.00`;
    checkoutOrderId.textContent = `Order ID: pay_order_${Math.floor(1000 + Math.random() * 9000)}`;

    // Show modal
    paymentCheckoutModal.style.display = 'flex';
    resetPaymentModalState();
  });

  const resetPaymentModalState = () => {
    btnExecutePayment.disabled = false;
    btnExecutePayment.querySelector('span').textContent = "Proceed to Payment";
    paymentLoadingSpinner.style.display = 'none';
    cardDetailsContainer.style.display = 'none';
    upiScannerDetailsContainer.style.display = 'none';
    document.querySelector('input[name="paymentMethod"][value="razorpay"]').checked = true;
  };

  closePaymentModalBtn.addEventListener('click', () => {
    paymentCheckoutModal.style.display = 'none';
  });

  // Toggle method views
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const method = e.target.value;
      cardDetailsContainer.style.display = method === 'card' ? 'flex' : 'none';
      upiScannerDetailsContainer.style.display = method === 'upi' ? 'flex' : 'none';
    });
  });

  // ----------------------------------------------------
  // 6. Complete Payment & SPA Confirmation Screen Routing
  // ----------------------------------------------------
  const bookingConfirmedPage = document.getElementById('bookingConfirmedPage');
  const ticketConfirmId = document.getElementById('ticketConfirmId');
  const ticketConfirmName = document.getElementById('ticketConfirmName');
  const ticketConfirmCount = document.getElementById('ticketConfirmCount');
  const ticketConfirmAmount = document.getElementById('ticketConfirmAmount');
  const ticketConfirmQrImage = document.getElementById('ticketConfirmQrImage');

  // Pending verification page elements
  const bookingPendingPage = document.getElementById('bookingPendingPage');
  const pendingConfirmId = document.getElementById('pendingConfirmId');
  const pendingConfirmName = document.getElementById('pendingConfirmName');
  const pendingConfirmCount = document.getElementById('pendingConfirmCount');
  const pendingConfirmTime = document.getElementById('pendingConfirmTime');
  const pendingConfirmAmount = document.getElementById('pendingConfirmAmount');
  const btnSendUpiProofWhatsApp = document.getElementById('btnSendUpiProofWhatsApp');
  const btnCopyUpiId = document.getElementById('btnCopyUpiId');
  const btnCopyUpiNumber = document.getElementById('btnCopyUpiNumber');

  let latestBooking = null;
  let countdownInterval = null;

  // SPA Route check function
  const checkRoute = () => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    if (path === '/booking-confirmed' || hash === '#booking-confirmed') {
      const lastBookingStr = localStorage.getItem('avalokana_last_booking');
      if (lastBookingStr) {
        try {
          const booking = JSON.parse(lastBookingStr);
          latestBooking = booking;
          if (booking.booking_status === 'Pending') {
            showPendingPage(booking);
          } else {
            showConfirmedPage(booking);
          }
        } catch (e) {
          console.error("Error parsing last booking", e);
          goToHome();
        }
      } else {
        goToHome();
      }
    } else if (path === '/booking-pending' || hash === '#booking-pending') {
      const lastBookingStr = localStorage.getItem('avalokana_last_booking');
      if (lastBookingStr) {
        try {
          const booking = JSON.parse(lastBookingStr);
          latestBooking = booking;
          showPendingPage(booking);
        } catch (e) {
          console.error("Error parsing last booking", e);
          goToHome();
        }
      } else {
        goToHome();
      }
    } else {
      hidePages();
    }
  };

  const goToHome = () => {
    localStorage.removeItem('avalokana_last_booking');
    if (window.location.pathname === '/booking-confirmed' || window.location.pathname === '/booking-pending') {
      history.pushState(null, '', '/');
    } else if (window.location.hash === '#booking-confirmed' || window.location.hash === '#booking-pending') {
      history.pushState(null, '', window.location.pathname);
    }
    hidePages();
  };

  const hidePages = () => {
    if (bookingConfirmedPage) {
      bookingConfirmedPage.style.display = 'none';
    }
    if (bookingPendingPage) {
      bookingPendingPage.style.display = 'none';
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  };

  if (btnCopyUpiId) {
    btnCopyUpiId.addEventListener('click', () => {
      navigator.clipboard.writeText('9964115521@ybl');
      alert('UPI ID copied to clipboard!');
    });
  }

  if (btnCopyUpiNumber) {
    btnCopyUpiNumber.addEventListener('click', () => {
      navigator.clipboard.writeText('9964115521');
      alert('UPI Phone Number copied to clipboard!');
    });
  }

  if (btnSendUpiProofWhatsApp) {
    btnSendUpiProofWhatsApp.addEventListener('click', () => {
      if (latestBooking) {
        const name = latestBooking.customer_name || latestBooking.name || 'Seeker';
        const bookingId = latestBooking.booking_id || '';
        const tickets = latestBooking.ticket_count || latestBooking.tickets_count || 1;
        const amount = latestBooking.total_amount || latestBooking.amount_paid || 1;
        const showTime = latestBooking.show_time || '3:45 PM';

        const message = `🎬 *AVALOKANA BOOKING SUBMITTED*\n\nHello, I have submitted a booking and made a UPI payment of *₹${amount}* for my ticket(s).\n\n🎟️ *Booking ID:* ${bookingId}\n👤 *Name:* ${name}\n🎟️ *Tickets:* ${tickets} Seat${tickets > 1 ? 's' : ''}\n🕔 *Show Time:* ${showTime}\n\n[Please attach your payment confirmation screenshot proof here] 🙏`;

        const url = `https://api.whatsapp.com/send?phone=919964115521&text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }
    });
  }

  const startCountdown = () => {
    const targetDate = new Date('2026-08-02T15:45:00+05:30').getTime(); // August 2nd, 2026 at 3:45 PM (1st Show)
    if (countdownInterval) clearInterval(countdownInterval);
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      const daysEl = document.getElementById('timerDays');
      const hoursEl = document.getElementById('timerHours');
      const minutesEl = document.getElementById('timerMinutes');
      const secondsEl = document.getElementById('timerSeconds');
      
      if (distance < 0) {
        clearInterval(countdownInterval);
        if (daysEl) daysEl.textContent = "00";
        if (hoursEl) hoursEl.textContent = "00";
        if (minutesEl) minutesEl.textContent = "00";
        if (secondsEl) secondsEl.textContent = "00";
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    };
    
    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
  };

  const showPendingPage = (booking) => {
    if (!bookingPendingPage) return;
    
    if (pendingConfirmId) pendingConfirmId.textContent = booking.booking_id;
    if (pendingConfirmName) pendingConfirmName.textContent = booking.customer_name;
    if (pendingConfirmCount) pendingConfirmCount.textContent = `${booking.ticket_count} Ticket${booking.ticket_count > 1 ? 's' : ''}`;
    if (pendingConfirmTime) pendingConfirmTime.textContent = booking.show_time || '3:45 PM';
    if (pendingConfirmAmount) pendingConfirmAmount.textContent = `₹${booking.total_amount}`;
    
    bookingPendingPage.style.display = 'block';
    bookingPendingPage.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  const showConfirmedPage = (booking) => {
    if (!bookingConfirmedPage) return;
    bookingConfirmedPage.scrollTop = 0;
    window.scrollTo(0, 0);
    
    // Populate elements
    if (ticketConfirmId) ticketConfirmId.textContent = booking.booking_id;
    if (ticketConfirmName) ticketConfirmName.textContent = booking.customer_name;
    if (ticketConfirmCount) ticketConfirmCount.textContent = `${booking.ticket_count} Ticket${booking.ticket_count > 1 ? 's' : ''}`;
    if (ticketConfirmAmount) ticketConfirmAmount.textContent = `₹${booking.total_amount}`;
    if (ticketConfirmQrImage) ticketConfirmQrImage.src = booking.qr_code_url;
    
    // Explicitly update venue, date, and show_time in the digital pass layout
    const ticketConfirmVenue = document.getElementById('ticketConfirmVenue');
    if (ticketConfirmVenue) ticketConfirmVenue.textContent = 'Suchitra Cinema and Cultural Academy';
    const ticketConfirmDate = document.getElementById('ticketConfirmDate');
    if (ticketConfirmDate) ticketConfirmDate.textContent = 'August 2, 2026';
    const ticketConfirmTime = document.getElementById('ticketConfirmTime');
    if (ticketConfirmTime) ticketConfirmTime.textContent = booking.show_time || '3:45 PM';
    
    // Show overlay
    bookingConfirmedPage.style.display = 'block';
    
    // Start countdown
    startCountdown();
  };

  const playSuccessGong = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime); // resonant low tone
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.0);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 3.2);
    } catch (e) {}
  };

  btnExecutePayment.addEventListener('click', () => {
    // Disable interface and show loading state
    btnExecutePayment.disabled = true;
    btnExecutePayment.querySelector('span').textContent = "Processing Payment...";
    paymentLoadingSpinner.style.display = 'block';

    // Simulate 2-second gateway network latency
    setTimeout(async () => {
      try {
        const name = bookingName.value.trim();
        const phone = bookingPhone.value.trim();
        const showTime = bookingShowTime ? bookingShowTime.value : '3:45 PM';

        const checkedCategory = document.querySelector('input[name="audienceCategory"]:checked');
        const categoryVal = checkedCategory ? checkedCategory.value : 'Public Audience';
        const professionVal = categoryVal === 'Film Maker' && bookingProfession ? `Film Maker - ${bookingProfession.value}` : 'Public Audience';

        // Submit to database
        const booking = await insertBooking({
          customer_name: name,
          email: 'N/A', // Omitted from UI
          phone: phone,
          ticket_count: quantity,
          ticket_price: TICKET_PRICE,
          total_amount: quantity * TICKET_PRICE,
          show_time: showTime,
          profession: professionVal,
          payment_id: 'pay_upi_' + Math.random().toString(36).substr(2, 9),
          payment_status: 'Pending',
          booking_status: 'Pending'
        });

        // Set latest booking for WhatsApp share
        latestBooking = booking;

        // Trigger meditative gong audio context
        playSuccessGong();

        // Save to localStorage for SPA reload / routing capability
        localStorage.setItem('avalokana_last_booking', JSON.stringify(booking));

        // Hide checkout
        paymentCheckoutModal.style.display = 'none';

        // Use SPA pushState routing
        history.pushState({ bookingId: booking.booking_id }, '', '/booking-pending');

        // Trigger page display
        showPendingPage(booking);

        // Clear inputs
        bookingDetailsForm.reset();
        quantity = 1;
        updateSummary();

        // Refresh seats count
        refreshSeats();

        // If console is active, refresh console logs as well
        if (isConsoleAuthenticated) {
          loadConsoleDashboardData();
        }

      } catch (err) {
        alert("Failed to confirm payment checkout: " + err.message);
        resetPaymentModalState();
      }
    }, 2000);
  });

  const openWhatsAppShare = (bookingObj) => {
    if (!bookingObj) return;
    const name = bookingObj.customer_name || bookingObj.name || 'Seeker';
    const phone = bookingObj.phone || '';
    const bookingId = bookingObj.booking_id || '';
    const tickets = bookingObj.ticket_count || bookingObj.tickets_count || 1;
    const amount = bookingObj.total_amount || bookingObj.amount_paid || 150;
    const showTime = bookingObj.show_time || '3:45 PM';

    const message = `🎬 *AVALOKANA BOOKING CONFIRMED*\n\nHello *${name}*,\n\nYour booking is confirmed for the exclusive screening of *Avalokana*.\n\n🎟️ *Booking ID:* ${bookingId}\n🎟️ *Tickets:* ${tickets} Seat${tickets > 1 ? 's' : ''}\n💰 *Total Paid:* ₹${amount}\n📍 *Venue:* Suchitra Cinema and Cultural Academy\n📅 *Date:* Sunday, August 2nd, 2026\n🕔 *Time:* ${showTime}\n\nShow your digital pass QR code at the entrance. Please arrive 30 minutes early.\n\nBlessings on your journey into the flow. 🙏`;

    // Strip non-numeric characters from phone
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Bind actions
  const btnDownloadPassPdf = document.getElementById('btnDownloadPassPdf');
  if (btnDownloadPassPdf) {
    btnDownloadPassPdf.addEventListener('click', () => {
      window.print();
    });
  }

  const btnSaveQrImageOnly = document.getElementById('btnSaveQrImageOnly');
  if (btnSaveQrImageOnly) {
    btnSaveQrImageOnly.addEventListener('click', async () => {
      if (!latestBooking || !latestBooking.qr_code_url) return;
      try {
        const response = await fetch(latestBooking.qr_code_url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `ticket_qr_${latestBooking.booking_id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("Failed to download QR code directly, opening in new tab:", err);
        window.open(latestBooking.qr_code_url, '_blank');
      }
    });
  }

  const btnSendWhatsAppDelivery = document.getElementById('btnSendWhatsAppDelivery');
  if (btnSendWhatsAppDelivery) {
    btnSendWhatsAppDelivery.addEventListener('click', () => {
      if (latestBooking) {
        openWhatsAppShare(latestBooking);
      } else {
        alert("No active ticket found to share.");
      }
    });
  }

  const btnAddToGoogleWallet = document.getElementById('btnAddToGoogleWallet');
  if (btnAddToGoogleWallet) {
    btnAddToGoogleWallet.addEventListener('click', () => {
      alert(`🎫 Adding ticket ${latestBooking ? latestBooking.booking_id : ''} to Google Wallet... Pass linked successfully!`);
    });
  }

  const btnAddToAppleWallet = document.getElementById('btnAddToAppleWallet');
  if (btnAddToAppleWallet) {
    btnAddToAppleWallet.addEventListener('click', () => {
      alert(`🎫 Adding ticket ${latestBooking ? latestBooking.booking_id : ''} to Apple Wallet... Pass linked successfully!`);
    });
  }

  const btnShareStoryWhatsApp = document.getElementById('btnShareStoryWhatsApp');
  if (btnShareStoryWhatsApp) {
    btnShareStoryWhatsApp.addEventListener('click', () => {
      const showTime = latestBooking ? (latestBooking.show_time || '3:45 PM') : '3:45 PM';
      const text = `🎬 I just reserved my seat for the exclusive screening of AVALOKANA at Suchitra Cinema and Cultural Academy! Join me on this spiritual cinematic journey on August 2nd at ${showTime}. Book your seats now at ${window.location.origin}!`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    });
  }

  const btnShareStoryInsta = document.getElementById('btnShareStoryInsta');
  if (btnShareStoryInsta) {
    btnShareStoryInsta.addEventListener('click', () => {
      const text = `🎬 Attending the exclusive screening of AVALOKANA at Suchitra Cinema and Cultural Academy! 🍿✨ #Avalokana #Cinema`;
      navigator.clipboard.writeText(text).then(() => {
        alert("Promo caption copied to clipboard! Open Instagram to post your story.");
      }).catch(() => {
        alert("Instagram caption: " + text);
      });
    });
  }

  const btnCopyEventLinkOnly = document.getElementById('btnCopyEventLinkOnly');
  if (btnCopyEventLinkOnly) {
    btnCopyEventLinkOnly.addEventListener('click', () => {
      const link = window.location.origin;
      navigator.clipboard.writeText(link).then(() => {
        alert("Event link copied to clipboard!");
      }).catch(() => {
        alert("Event link: " + link);
      });
    });
  }

  const btnReturnFromConfirmPage = document.getElementById('btnReturnFromConfirmPage');
  if (btnReturnFromConfirmPage) {
    btnReturnFromConfirmPage.addEventListener('click', () => {
      goToHome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Initialize route checks
  checkRoute();
  window.addEventListener('popstate', checkRoute);
  window.addEventListener('hashchange', checkRoute);

  // ----------------------------------------------------
  // 7. Integrated Organizer Console Controller
  // ----------------------------------------------------
  const navLinkOrganizer = document.getElementById('navLinkOrganizer');
  const footerLinkOrganizer = document.getElementById('footerLinkOrganizer');
  const adminConsoleOverlay = document.getElementById('adminConsoleOverlay');
  const closeAdminConsoleBtn = document.getElementById('closeAdminConsoleBtn');
  
  const consoleLockScreen = document.getElementById('consoleLockScreen');
  const consoleDashboard = document.getElementById('consoleDashboard');
  const consolePasscode = document.getElementById('consolePasscode');
  const btnUnlockConsole = document.getElementById('btnUnlockConsole');
  const consoleLockErrorMsg = document.getElementById('consoleLockErrorMsg');

  const consoleMetricTotalBookings = document.getElementById('consoleMetricTotalBookings');
  const consoleMetricTotalRevenue = document.getElementById('consoleMetricTotalRevenue');
  const consoleMetricTicketsSold = document.getElementById('consoleMetricTicketsSold');
  const consoleSearchInput = document.getElementById('consoleSearchInput');
  const consoleBtnOpenManualBooking = document.getElementById('consoleBtnOpenManualBooking');
  const consoleBtnRefresh = document.getElementById('consoleBtnRefresh');
  const consoleBookingsTableBody = document.getElementById('consoleBookingsTableBody');

  const manualBookingModal = document.getElementById('manualBookingModal');
  const closeManualBookingModalBtn = document.getElementById('closeManualBookingModalBtn');
  const manualBookingForm = document.getElementById('manualBookingForm');
  const manualName = document.getElementById('manualName');
  const manualPhone = document.getElementById('manualPhone');
  const btnManualMinus = document.getElementById('btnManualMinus');
  const btnManualPlus = document.getElementById('btnManualPlus');
  const manualQtyValue = document.getElementById('manualQtyValue');
  const manualTotalAmount = document.getElementById('manualTotalAmount');
  const btnConfirmManualBooking = document.getElementById('btnConfirmManualBooking');
  const manualLoadingSpinner = document.getElementById('manualLoadingSpinner');

  const correctPasscode = 'admin123';
  let isConsoleAuthenticated = false;
  let manualQuantity = 1;

  const openConsole = () => {
    adminConsoleOverlay.style.display = 'flex';
    if (isConsoleAuthenticated) {
      consoleLockScreen.style.display = 'none';
      consoleDashboard.style.display = 'block';
      loadConsoleDashboardData();
    } else {
      consoleLockScreen.style.display = 'block';
      consoleDashboard.style.display = 'none';
      consolePasscode.value = '';
      consoleLockErrorMsg.style.display = 'none';
    }
  };

  if (navLinkOrganizer) navLinkOrganizer.addEventListener('click', (e) => { e.preventDefault(); openConsole(); });
  if (footerLinkOrganizer) footerLinkOrganizer.addEventListener('click', (e) => { e.preventDefault(); openConsole(); });
  
  if (closeAdminConsoleBtn) {
    closeAdminConsoleBtn.addEventListener('click', () => {
      adminConsoleOverlay.style.display = 'none';
    });
  }

  const handleConsoleUnlock = () => {
    if (consolePasscode.value === correctPasscode) {
      isConsoleAuthenticated = true;
      consoleLockScreen.style.display = 'none';
      consoleDashboard.style.display = 'block';
      consoleLockErrorMsg.style.display = 'none';
      loadConsoleDashboardData();
    } else {
      consoleLockErrorMsg.style.display = 'block';
      consolePasscode.value = '';
    }
  };

  if (btnUnlockConsole) btnUnlockConsole.addEventListener('click', handleConsoleUnlock);
  if (consolePasscode) {
    consolePasscode.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleConsoleUnlock();
    });
  }

  const loadConsoleDashboardData = async () => {
    try {
      const summary = await fetchBookingsSummary();
      consoleMetricTotalBookings.textContent = summary.totalBookings;
      consoleMetricTotalRevenue.textContent = `₹${summary.totalRevenue}`;
      consoleMetricTicketsSold.textContent = `${summary.totalTicketsSold} / 200`;
    } catch (err) {
      console.error(err);
    }

    try {
      const q = consoleSearchInput.value;
      const records = await searchBookings(q);
      renderConsoleBookings(records);
    } catch (err) {
      console.error(err);
    }
  };

  const renderConsoleBookings = (records) => {
    consoleBookingsTableBody.innerHTML = '';
    if (!records || records.length === 0) {
      consoleBookingsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:30px; color:var(--text-secondary);">
            No bookings found.
          </td>
        </tr>
      `;
      return;
    }

    records.forEach(b => {
      const isSuccess = b.payment_status === 'Success';
      const statusPill = isSuccess
        ? '<span style="color:#26df98; background:rgba(38,223,152,0.08); padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.75rem;">Success</span>'
        : '<span style="color:#ff3344; background:rgba(255,51,68,0.08); padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.75rem;">Pending</span>';

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
      tr.innerHTML = `
        <td style="padding:15px 20px; font-weight:700; color:var(--accent-gold);">${b.booking_id || b.id.substring(0,8)}</td>
        <td style="padding:15px 20px; font-weight:600; color:#fff;">${b.customer_name || b.name || 'Walk-in Seeker'}</td>
        <td style="padding:15px 20px; color:#fff;">${b.phone || 'N/A'}</td>
        <td style="padding:15px 20px; font-weight:600; color:#fff;">${b.ticket_count || b.tickets_count || 1}</td>
        <td style="padding:15px 20px; font-weight:600; color:var(--accent-gold);">₹${b.total_amount || b.amount_paid || 100}</td>
        <td style="padding:15px 20px;">${statusPill}</td>
        <td style="padding:15px 20px; text-align:center;">
          <div style="display:flex; justify-content:center; gap:8px;">
            ${!isSuccess ? `<button type="button" class="btn-approve-booking btn" data-id="${b.id}" style="padding:6px 12px; font-size:0.7rem; border-radius:4px; border:1px solid var(--accent-gold); color:var(--accent-gold); background:none; font-family:var(--font-body); letter-spacing:0; text-transform:none; cursor:pointer;">Approve</button>` : ''}
            <button type="button" class="btn-whatsapp-booking btn" data-id="${b.id}" style="padding:6px 12px; font-size:0.7rem; border-radius:4px; border:1px solid #25d366; color:#25d366; background:none; font-family:var(--font-body); letter-spacing:0; text-transform:none; cursor:pointer;">WhatsApp</button>
            <button type="button" class="btn-delete-booking btn-secondary" data-id="${b.id}" style="padding:6px 12px; font-size:0.7rem; border-radius:4px; border-color:#ff3344; color:#ff3344; background:none; font-family:var(--font-body); letter-spacing:0; text-transform:none; cursor:pointer;">Delete</button>
          </div>
        </td>
      `;
      consoleBookingsTableBody.appendChild(tr);
    });

    // Register button event handlers for approve, delete & WhatsApp in console
    document.querySelectorAll('.btn-approve-booking').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm("Confirm payment received and approve this booking?")) {
          e.target.disabled = true;
          e.target.textContent = "Approving...";
          try {
            await approveBooking(id);
            alert("Booking payment approved successfully!");
            loadConsoleDashboardData();
            refreshSeats();
          } catch (err) {
            alert("Failed to approve booking: " + err.message);
            e.target.disabled = false;
            e.target.textContent = "Approve";
          }
        }
      });
    });

    document.querySelectorAll('.btn-whatsapp-booking').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const b = records.find(r => r.id === id);
        if (b) openWhatsAppShare(b);
      });
    });

    document.querySelectorAll('.btn-delete-booking').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm("Are you sure you want to delete this booking permanently?")) {
          e.target.disabled = true;
          e.target.textContent = "Deleting...";
          try {
            if (isOfflineMode() || id.startsWith('mock-uuid-') || id.startsWith('bkg-')) {
              let localBookings = JSON.parse(localStorage.getItem('avalokana_bookings') || '[]');
              localBookings = localBookings.filter(b => b.id !== id);
              localStorage.setItem('avalokana_bookings', JSON.stringify(localBookings));
            } else {
              const { error } = await supabase.from('bookings').delete().eq('id', id);
              if (error) throw error;
            }
            loadConsoleDashboardData();
            refreshSeats();
          } catch (err) {
            alert("Failed: " + err.message);
            loadConsoleDashboardData();
          }
        }
      });
    });
  };

  if (consoleBtnRefresh) consoleBtnRefresh.addEventListener('click', loadConsoleDashboardData);
  if (consoleSearchInput) {
    consoleSearchInput.addEventListener('keyup', () => {
      loadConsoleDashboardData();
    });
  }

  // Walk-in Ticket Form controllers
  const updateManualQtySummary = () => {
    manualQtyValue.textContent = manualQuantity;
    manualTotalAmount.textContent = `₹${manualQuantity * TICKET_PRICE}`;
  };

  if (consoleBtnOpenManualBooking) {
    consoleBtnOpenManualBooking.addEventListener('click', () => {
      manualBookingForm.reset();
      manualQuantity = 1;
      updateManualQtySummary();
      manualBookingModal.style.display = 'flex';
    });
  }

  if (closeManualBookingModalBtn) {
    closeManualBookingModalBtn.addEventListener('click', () => {
      manualBookingModal.style.display = 'none';
    });
  }

  if (btnManualMinus) {
    btnManualMinus.addEventListener('click', () => {
      if (manualQuantity > 1) {
        manualQuantity--;
        updateManualQtySummary();
      }
    });
  }

  if (btnManualPlus) {
    btnManualPlus.addEventListener('click', () => {
      manualQuantity++;
      updateManualQtySummary();
    });
  }

  if (btnConfirmManualBooking) {
    btnConfirmManualBooking.addEventListener('click', async () => {
      if (!manualBookingForm.checkValidity()) {
        manualBookingForm.reportValidity();
        return;
      }

      btnConfirmManualBooking.disabled = true;
      btnConfirmManualBooking.querySelector('span').textContent = "Confirming Booking...";
      manualLoadingSpinner.style.display = 'block';

      try {
        const name = manualName.value.trim();
        const phone = manualPhone.value.trim();
        const manualShowTime = document.getElementById('manualShowTime');
        const showTime = manualShowTime ? manualShowTime.value : '3:45 PM';

        const booking = await insertBooking({
          customer_name: name,
          email: 'N/A', // Omitted from UI
          phone: phone,
          ticket_count: manualQuantity,
          ticket_price: TICKET_PRICE,
          total_amount: manualQuantity * TICKET_PRICE,
          show_time: showTime,
          payment_id: 'pay_manual_' + Math.random().toString(36).substr(2, 9),
          payment_status: 'Success',
          booking_status: 'Confirmed'
        });

        // Set latest booking object
        latestBooking = booking;

        // Sound gong, close manual forms and console overlay
        playSuccessGong();
        manualBookingModal.style.display = 'none';
        if (adminConsoleOverlay) adminConsoleOverlay.style.display = 'none';

        // Save to localStorage for SPA routing
        localStorage.setItem('avalokana_last_booking', JSON.stringify(booking));

        // Use SPA pushState routing
        history.pushState({ bookingId: booking.booking_id }, '', '/booking-confirmed');

        // Trigger page display
        showConfirmedPage(booking);

        // Update logs lists
        loadConsoleDashboardData();
        refreshSeats();

      } catch (err) {
        alert("Failed to confirm manual ticket booking: " + err.message);
      } finally {
        btnConfirmManualBooking.disabled = false;
        btnConfirmManualBooking.querySelector('span').textContent = "Generate & Confirm Ticket";
        manualLoadingSpinner.style.display = 'none';
      }
    });
  }

});
