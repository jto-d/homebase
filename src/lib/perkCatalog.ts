// Per-product perk templates, keyed by the same design slug as CARD_CATALOG.
// When a user adds a card from the catalog, these perks are created on it.
// Cards omitted here carry no pre-set perks.

export interface PerkTemplate {
  name: string
  totalAmount: number
  period: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'QUADRENNIAL'
  resetType: 'CALENDAR' | 'ANNIVERSARY'
  enrollmentRequired: boolean
  notes?: string
}

// Shared template for open-ended lounge perks (totalAmount: 0 = no cap sentinel)
const priorityPass: PerkTemplate = {
  name: 'Priority Pass Lounge',
  totalAmount: 0,
  period: 'ANNUAL',
  resetType: 'CALENDAR',
  enrollmentRequired: false,
  notes: 'Priority Pass Select membership. Unlimited visits at 1,400+ lounges worldwide. Log each visit with its estimated value.',
}

export const PERK_CATALOG: Record<string, PerkTemplate[]> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // AMERICAN EXPRESS
  // ═══════════════════════════════════════════════════════════════════════════

  // Charge Cards
  'amex-gold': [
    { name: 'Uber Cash', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Adds to Uber account; use on U.S. rides or Uber Eats. Enrollment required.' },
    { name: 'Dining Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Participating partners (Buffalo Wild Wings, Wonder, Goldbelly & Wine.com through 6/30). Enrollment required.' },
    { name: "Dunkin' Credit", totalAmount: 7, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $84/yr at U.S. Dunkin locations. Enrollment required.' },
    { name: 'Resy Credit', totalAmount: 50, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $100/yr. Jan–Jun and Jul–Dec at U.S. Resy restaurants. Enrollment required.' },
    { name: 'Hotel Credit', totalAmount: 100, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $100/yr. Prepaid Fine Hotels + Resorts or The Hotel Collection (2-night min) via Amex Travel.' },
  ],
  'amex-platinum': [
    { name: 'Centurion Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Unlimited access to Amex Centurion Lounges. Log each visit with its estimated value.' },
    priorityPass,
    { name: 'Delta Sky Club Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Unlimited access to Delta Sky Club Lounges. Log each visit with its estimated value.' },
    { name: 'Hotel Credit', totalAmount: 300, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $600/yr. Prepaid Fine Hotels + Resorts or The Hotel Collection (2-night min) via Amex Travel.' },
    { name: 'Uber Cash', totalAmount: 15, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $180/yr. Adds to Uber account; use on U.S. rides or Uber Eats. Bonus $20 in December. Enrollment required.' },
    { name: 'Uber One', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr for auto-renewing Uber One membership. Enrollment required.' },
    { name: 'Airline Fee Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Select one airline each year; incidental fees only.' },
    { name: 'Fine Hotels + Resorts Credit', totalAmount: 100, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $100/yr. Prepaid Fine Hotels + Resorts or The Hotel Collection (2-night min) via Amex Travel.' },
    { name: 'Resy Credit', totalAmount: 100, period: 'QUARTERLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $400/yr. Eligible Resy restaurant purchases. Enrollment required.' },
    { name: 'Digital Entertainment Credit', totalAmount: 25, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $300/yr. Disney+, Hulu, ESPN, Peacock, Paramount+, NYT, WSJ, YouTube TV/Premium. Enrollment required.' },
    { name: 'lululemon Credit', totalAmount: 75, period: 'QUARTERLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $300/yr. U.S. retail stores (excl. outlets) and lululemon.com. Enrollment required.' },
    { name: 'Walmart+ Credit', totalAmount: 12.95, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Reimburses one monthly Walmart+ membership (plus tax). Pay with the card.' },
    { name: 'CLEAR Plus', totalAmount: 209, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Reimburses CLEAR Plus membership.' },
    { name: 'Equinox Credit', totalAmount: 300, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $300/yr (often disbursed monthly in practice) toward Equinox memberships. Enrollment required.' },
    { name: 'Oura Ring Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Toward an Oura Ring / Oura membership. Enrollment required.' },
  ],
  'amex-blue-cash-preferred': [
    { name: 'Disney Streaming Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Disney+, Hulu, and ESPN' },
  ],
  'amex-blue-cash-everyday': [
    { name: 'Disney Streaming Credit', totalAmount: 7, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $84/yr. Disney+, Hulu, and ESPN' },
  ],
  'amex-green': [
    { name: 'CLEAR Plus', totalAmount: 209, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Reimburses CLEAR Plus membership.' },
  ],

  // Delta
  'delta-sky-miles-gold': [
    { name: 'Rideshare Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Enrollment required.' },
    { name: 'Delta Stays Credit', totalAmount: 100, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $100/yr. Delta Stays credit for prepaid hotel stays via Amex Travel.' },
  ],
  'delta-sky-miles-platinum': [
    { name: 'Companion Certificate', totalAmount: 1000, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Worth roughly up to $1000/yr. Companion certificate for a free round-trip flight on Delta.' },
    { name: 'Rideshare Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Enrollment required.' },
    { name: 'Resy Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Enrollment required.' },
    { name: 'Delta Stays Credit', totalAmount: 150, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $150/yr. Delta Stays credit for prepaid hotel stays via Amex Travel.' },
  ],
  'delta-sky-miles-reserve': [
    { name: 'Companion Certificate', totalAmount: 1000, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Worth roughly up to $1000/yr. Companion certificate for a free round-trip flight on Delta.' },
    { name: 'Centurion Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Unlimited access to Amex Centurion Lounges. Log each visit with its estimated value.' },
    { name: 'Delta Sky Club Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Unlimited access to Delta Sky Club Lounges. Log each visit with its estimated value.' },
    { name: 'Rideshare Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Enrollment required.' },
    { name: 'Resy Credit', totalAmount: 20, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $240/yr. Enrollment required.' },
    { name: 'Delta Stays Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $200/yr. Delta Stays credit for prepaid hotel stays via Amex Travel.' },
  ],

  // Marriott
  'marriott-bonvoy-brilliant': [
    { name: 'Brilliant Dining Credit', totalAmount: 25, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $300/yr. Any dining purchases.' },
    { name: 'Free Night Award', totalAmount: 500, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to 85000 Marriott Bonvoy points. Free night award for Marriott bookings.' },
  ],

  
  // ═══════════════════════════════════════════════════════════════════════════
  // AMEX BUSINESS
  // ═══════════════════════════════════════════════════════════════════════════

  'amex-business-gold': [
    { name: 'Grubhub / Office Supply Credit', totalAmount: 20, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $240/yr. Eligible purchases at Grubhub and U.S. office supply stores. (FedEx was also eligible through 10/01/2026.)' },
    { name: 'Walmart+ Credit', totalAmount: 12.95, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Reimburses one monthly Walmart+ membership (plus tax). Pay with the card.' },
    { name: 'ChatGPT Business Credit', totalAmount: 300, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $300/yr on ChatGPT Business subscriptions.' },
    { name: 'Squarespace Credit', totalAmount: 150, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $150/yr on Squarespace purchases.' },
  ],
  'amex-business-platinum': [
    { name: 'Centurion Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Unlimited access to Amex Centurion Lounges. Log each visit with its estimated value.' },
    priorityPass,
    { name: 'Delta Sky Club Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: '10 complimentary Delta Sky Club visits per Medallion year when flying on an eligible Delta flight. Log each visit with its estimated value.' },
    { name: 'Hotel Credit', totalAmount: 300, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $600/yr. Prepaid Fine Hotels + Resorts or The Hotel Collection (2-night min) via Amex Travel.' },
    { name: 'Airline Fee Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Select one airline per year; incidental fees only. Enrollment required.' },
    { name: 'Hilton Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $200/yr on Hilton bookings.' },
    { name: 'Indeed Credit', totalAmount: 90, period: 'QUARTERLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $360/yr ($90/quarter) on Indeed recruiting purchases.' },
    { name: 'Wireless Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $120/yr on wireless service charges from U.S. providers.' },
    { name: 'Dell Technologies Credit', totalAmount: 150, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $150/yr base ($75 per semi-annual period). Spend $5,000+ on Dell in the calendar year to unlock an additional $1,000 statement credit.' },
    { name: 'Adobe Credit', totalAmount: 250, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $250/yr. Requires at least $600 in Adobe purchases in the calendar year.' },
    { name: 'ChatGPT Business Credit', totalAmount: 300, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $300/yr on ChatGPT Business subscriptions.' },
    { name: 'CLEAR Plus', totalAmount: 209, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Reimburses CLEAR Plus membership.' },
    { name: 'Global Entry / TSA PreCheck Credit', totalAmount: 120, period: 'QUADRENNIAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $120 every 4-5 years for Global Entry application fee (includes TSA PreCheck).' },
  ],

  // Marriott Business
  'amex-marriott-bonvoy-business': [
    { name: 'Free Night Award', totalAmount: 300, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'One free night award after card renewal month (up to 35,000 Bonvoy points, ~$300 value). Earn a second award after $60,000 in purchases in a calendar year.' },
  ],

  // Delta Business
  'delta-sky-miles-gold-business': [
    { name: 'Rideshare Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr after first card renewal. Enrollment required.' },
    { name: 'Delta Stays Credit', totalAmount: 150, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $150/yr. Prepaid hotel stays or vacation rentals via Delta Stays.' },
  ],
  'delta-sky-miles-platinum-business': [
    { name: 'Resy Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Eligible U.S. Resy restaurant purchases. Enrollment required.' },
    { name: 'Rideshare Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Enrollment required.' },
    { name: 'Delta Stays Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $200/yr. Prepaid hotel stays or vacation rentals via Delta Stays.' },
    { name: 'Global Entry / TSA PreCheck Credit', totalAmount: 120, period: 'QUADRENNIAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $120 every 4-5 years for Global Entry application fee (includes TSA PreCheck).' },
  ],
  'delta-sky-miles-reserve-business': [
    { name: 'Delta Sky Club Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: '15 Delta Sky Club visits per Medallion year (unlimited after $75,000 annual spend). Log each visit with its estimated value.' },
    { name: 'Centurion Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Complimentary access to Amex Centurion Lounges when flying Delta. Log each visit with its estimated value.' },
    { name: 'Resy Credit', totalAmount: 20, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $240/yr. Eligible U.S. Resy restaurant purchases. Enrollment required.' },
    { name: 'Rideshare Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $120/yr. Enrollment required.' },
    { name: 'Delta Stays Credit', totalAmount: 250, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $250/yr. Prepaid hotel stays or vacation rentals via Delta Stays.' },
    { name: 'Global Entry / TSA PreCheck Credit', totalAmount: 120, period: 'QUADRENNIAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $120 every 4-5 years for Global Entry application fee (includes TSA PreCheck).' },
  ],


  // ═══════════════════════════════════════════════════════════════════════════
  // CAPITAL ONE
  // ═══════════════════════════════════════════════════════════════════════════

  'capital-one-venture-x': [
    priorityPass,
    { name: 'Capital One Travel Credit', totalAmount: 300, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $300/yr. Travel purchases via Capital One Travel.' },
  ],


  // ═══════════════════════════════════════════════════════════════════════════
  // CAPITAL ONE BUSINESS  
  // ═══════════════════════════════════════════════════════════════════════════
  
  'capital-one-venture-x-business': [
    priorityPass,
    { name: 'Capital One Business Travel Credit', totalAmount: 300, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $300/yr. Travel purchases via Capital One Business Travel.' },
  ],
  'capital-one-venture-business': [
    { name: 'Capital One Business Travel Credit', totalAmount: 50, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $300/yr. Travel purchases via Capital One Business Travel.' },
    { name: 'Advertising/Software Credit', totalAmount: 50, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $50/yr. Advertising/Software purchases at qualifying advertising or software merchants.' },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // CHASE
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Sapphire
  'chase-sapphire-preferred': [
    { name: 'Chase Travel Hotel Credit', totalAmount: 50, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $50 each ANNIVERSARY year (not calendar). Hotel stays via Chase Travel.' },
    { name: 'DoorDash Non-Restaurant Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'One $10 promo/mo on non-restaurant orders. Requires active complimentary DashPass (activate by 12/31/27).' },
  ],
  'chase-sapphire-reserve': [
    priorityPass,
    { name: 'Chase Sapphire Lounges', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Unlimited access to Chase Sapphire Lounges. Log each visit with its estimated value.' },
    { name: 'Travel Credit', totalAmount: 300, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'ANNIVERSARY-year reset (not calendar). Auto-applies to first $300 of travel purchases.' },
    { name: 'The Edit Hotel Credit', totalAmount: 250, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $500/yr, max $250 per transaction. Prepaid 2-night+ stays via The Edit. As of 2026, flexible calendar-year timing (no longer split semi-annually).' },
    { name: 'Dining Credit (Exclusive Tables)', totalAmount: 150, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $300/yr. Sapphire Reserve Exclusive Tables via OpenTable. Jan–Jun and Jul–Dec.' },
    { name: 'StubHub / viagogo Credit', totalAmount: 150, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $300/yr. Jan–Jun and Jul–Dec. Activation required.' },
    { name: 'Apple TV and Music Subscription Credit', totalAmount: 288, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Free Apple TV + Apple Music subscription for one year.'},
    { name: 'DoorDash Restaurant Credit', totalAmount: 5, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'On restaurant orders. Requires DashPass (activate by 12/31/27).' },
    { name: 'DoorDash Non-Restaurant Credit', totalAmount: 20, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Two $10 promos/mo on grocery/retail. Second unlocks only after first is used.' },
    { name: 'Lyft Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'In-app credit through 9/30/27. (Also 5x points on Lyft.)' },
    { name: 'Peloton Membership Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $120/yr toward Peloton memberships.' },
  ],

  // Freedom
  'chase-freedom-unlimited': [
    { name: 'DoorDash Non-Restaurant Credit', totalAmount: 10, period: 'QUARTERLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $10/quarter on non-restaurant orders through 12/31/27. Requires active DashPass.' },
  ],

  // United
  'united-quest': [
    { name: 'United TravelBank Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'ANNIVERSARY year. $200 TravelBank cash at opening + each anniversary; United-operated flights only.' },
    { name: 'Renowned Hotels Credit', totalAmount: 150, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'ANNIVERSARY year. Prepaid stays via Renowned Hotels and Resorts for United Cardmembers.' },
    { name: 'Rideshare Credit', totalAmount: 8, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $100/yr — $8/mo Jan–Nov and $12 in Dec. Calendar year. Annual opt-in required.' },
    { name: 'Avis / Budget Credit', totalAmount: 80, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'ANNIVERSARY year. $40 TravelBank cash on each of 1st & 2nd rental via cars.united.com.' },
    { name: 'Instacart Credit', totalAmount: 15, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $180/yr — split $10 + $5 monthly. Calendar year.' },
  ],
  'united-explorer': [
    { name: 'United Travel Credit', totalAmount: 100, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Earned only AFTER spending $10,000 in a calendar year (spend-gated, not automatic).' },
    { name: 'United Hotels Credit', totalAmount: 50, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $100/yr — $50 on each of 1st & 2nd prepaid United Hotels bookings per ANNIVERSARY year.' },
    { name: 'Rideshare Credit', totalAmount: 5, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $60/yr. Calendar year. Enrollment + annual opt-in required.' },
    { name: 'Avis / Budget Credit', totalAmount: 50, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: '$25 TravelBank cash on each of 1st & 2nd Avis/Budget rental via cars.united.com.' },
    { name: 'Instacart Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $120/yr. Plus 3-month complimentary Instacart+ membership.' },
  ],
  'united-club': [
    { name: 'United Club Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'United Club membership included. Unlimited access to United Club and partner lounges. Log each visit with its estimated value.' },
    { name: 'Global Entry / TSA PreCheck Credit', totalAmount: 100, period: 'QUADRENNIAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $100 every 4 years for Global Entry application fee (includes TSA PreCheck). Statement credit posted within 2–3 billing cycles.' },
  ],

  // Southwest
  'southwest-priority': [
    { name: 'Southwest Travel Credit', totalAmount: 75, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $75/yr toward Southwest Airlines purchases. Applied as a statement credit.' },
  ],

  // IHG
  'ihg-one-rewards-premier': [
    { name: 'Global Entry / TSA PreCheck Credit', totalAmount: 100, period: 'QUADRENNIAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $100 every 4 years for Global Entry application fee (includes TSA PreCheck).' },
  ],


  // ═══════════════════════════════════════════════════════════════════════════
  // CHASE BUSINESS
  // ═══════════════════════════════════════════════════════════════════════════

  // Sapphire Business
  'chase-sapphire-reserve-business': [
    priorityPass,
    { name: 'Chase Sapphire Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Unlimited access to Chase Sapphire Lounges by The Club and Air Canada Maple Leaf Lounges (2 complimentary guests). Log each visit with its estimated value.' },
    { name: 'Travel Credit', totalAmount: 300, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'ANNIVERSARY-year reset. Auto-applies to first $300 of eligible travel purchases (airfare, hotels, transit, campgrounds, travel agencies, etc.).' },
    { name: 'The Edit Hotel Credit', totalAmount: 250, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $500/yr ($250 per semi-annual period). Prepaid stays via The Edit by Chase Travel.' },
    { name: 'Google Workspace Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $200/yr on Google Workspace purchases.' },
    { name: 'ZipRecruiter Credit', totalAmount: 100, period: 'QUARTERLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $400/yr ($100/quarter) on ZipRecruiter purchases.' },
    { name: 'Lyft Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $120/yr in-app Lyft credit through 9/30/27.' },
    { name: 'DoorDash Credit', totalAmount: 25, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $300/yr in DoorDash promos. Includes complimentary DashPass (activate by 12/31/27).' },
    { name: 'Global Entry / TSA PreCheck / NEXUS Credit', totalAmount: 120, period: 'QUADRENNIAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $120 every 4 years for Global Entry (includes TSA PreCheck) or NEXUS application fee.' },
  ],

  // United Business
  'united-business': [
    { name: 'United Travel Credit', totalAmount: 125, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Earned AFTER 5 United flight purchases of $100+ each cardmember year (spend-gated). Awarded as United TravelBank credit.' },
    { name: 'United Hotels Credit', totalAmount: 100, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $100/yr on prepaid United Hotels bookings per anniversary year.' },
    { name: 'Rideshare Credit', totalAmount: 100, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $100/yr. Annual opt-in required.' },
    { name: 'Avis / Budget Credit', totalAmount: 50, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $50/yr on Avis/Budget car rentals via cars.united.com.' },
    { name: 'JSX Credit', totalAmount: 100, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $100/yr on JSX semi-private flight purchases.' },
    { name: 'Instacart Credit', totalAmount: 10, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $120/yr. Plus complimentary Instacart+ membership.' },
  ],
  'united-club-business': [
    { name: 'United Club Lounge', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'United Club membership included. Unlimited access to United Club and partner lounges. Log each visit with its estimated value.' },
    { name: 'Global Entry / TSA PreCheck Credit', totalAmount: 120, period: 'QUADRENNIAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $120 every 4 years for Global Entry application fee (includes TSA PreCheck).' },
    { name: 'Renowned Hotels Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $200/yr on prepaid stays via Renowned Hotels and Resorts for United.' },
    { name: 'Rideshare Credit', totalAmount: 150, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: true, notes: 'Up to $150/yr. Enrollment required.' },
    { name: 'Avis / Budget Credit', totalAmount: 100, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $100/yr on Avis/Budget car rentals via cars.united.com.' },
    { name: 'Instacart Credit', totalAmount: 20, period: 'MONTHLY', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $240/yr. Complimentary Instacart+ membership through 12/31/27.' },
    { name: 'JSX Credit', totalAmount: 200, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $200/yr on JSX semi-private flight purchases.' },
  ],

  // Southwest Business
  'southwest-performance-business': [
    { name: 'Southwest Travel Credit', totalAmount: 250, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $500/yr. $250 each in Jan–Jun and Jul–Dec toward Southwest Airlines purchases.' },
    { name: 'In-flight Wi-Fi Credit', totalAmount: 0, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to 365 credits of $8 each for inflight Wi-Fi on Southwest flights through 12/31/26. Effectively unlimited Wi-Fi for most flyers. Log each use.' },
    { name: 'Global Entry / TSA PreCheck / NEXUS Credit', totalAmount: 120, period: 'QUADRENNIAL', resetType: 'ANNIVERSARY', enrollmentRequired: false, notes: 'Up to $120 every 4 years for Global Entry (includes TSA PreCheck) or NEXUS application fee.' },
  ],


  // ═══════════════════════════════════════════════════════════════════════════
  // BILT
  // ═══════════════════════════════════════════════════════════════════════════

  'bilt-obsidian': [
    priorityPass,
    { name: 'Bilt Travel Hotel Credit', totalAmount: 50, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $100/yr. $50 each in Jan–Jun and Jul–Dec. Bilt Travel Portal, 2-night min.' },
  ],
  'bilt-palladium': [
    priorityPass,
    { name: 'Bilt Travel Hotel Credit', totalAmount: 200, period: 'SEMI_ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Up to $400/yr. $200 each in Jan–Jun and Jul–Dec. Bilt Travel Portal, 2-night min.' },
    { name: 'Bilt Cash (annual)', totalAmount: 200, period: 'ANNUAL', resetType: 'CALENDAR', enrollmentRequired: false, notes: 'Bilt Cash credited Jan 1 (or at approval). NOT a statement credit — only $100 rolls over, rest expires 12/31.' },
  ],
}
