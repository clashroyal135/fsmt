// Edit this file through Codex to publish competition details, news, FAQs, and past tournaments.
// These are public settings. Never add credentials or registration records here.
export const site = {
  name: "Fulton Science Math Tournament",
  organizer: "Fulton Science Academy Mu Alpha Theta",
  tagline: "A little curiosity. A world of possibility.",
  description: "Join the Fulton Science Math Tournament for students in grades 3, 4, and 5, featuring Individual, Team, and Relay rounds. Organized by Fulton Science Academy Mu Alpha Theta.",
  registrationOpen: true,
  // Paste the Google Form share link here (docs.google.com/forms/... or forms.gle/...).
  registrationFormUrl: "https://forms.gle/QsQDTrrTADWsS3K49",
  date: "October 31, 2026",
  dateNotice: "The tournament has been postponed three weeks to October 31, 2026 due to Hurricane Isaias and other conflicting activities. Families who already registered and received a confirmation email have been sent an additional email with more information. We apologize for the change.",
  format: "Individual, Team, and Relay",
  teamFormation: "Register as an individual (one student) or as a team of four students. A team registers all four members on one form, so only one form should be submitted per team. Students who register individually will be placed on a team by the organizer.",
  time: "Check-in opens 8:30 AM · Competition begins 9:00 AM",
  location: "Fulton Science Academy Cafeteria, 3035 Fanfare Way, Alpharetta, GA 30009",
  deadline: "October 29, 2026 at 11:59 PM",
  fee: "$25 per person · $100 for a team of 4",
  donationUrl: "https://www.givecampus.com/schools/FultonScienceAcademyPrivateSchool/events/fsmt-fall-2026",
  donationInstructions: "After submitting the registration form, pay on the school's donation website. If the donation page has a notes field, include the parent or guardian name and the student names from your registration so the organizer can match your payment.",
  contactEmail: "fsmt@fultonscienceacademy.org",
  schedule: [
    { time: "8:30 AM", label: "Check-in opens" },
    { time: "9:00 AM", label: "Competition begins" },
    { time: "About 11:30 AM", label: "Competition ends, break for students" },
    { time: "About 12:00 PM", label: "Award ceremony" }
  ],
  rounds: [
    { name: "Individual Round", summary: "25 problems · 40 minutes", description: "Students independently solve 25 problems in 40 minutes. Each correct answer earns 1 point, for a maximum of 25 points per student (100 per team)." },
    { name: "Team Round", summary: "10 problems · 20 minutes", description: "Teams of four work together to solve 10 problems in 20 minutes. Each correct answer earns 10 points, for a maximum of 100 points." },
    { name: "Relay Round", summary: "2 sets of 4 problems · 10 minutes per set", description: "Teams complete two sets of four connected problems, with 10 minutes per set. Each problem after the first depends on the previous answer. All four students can work together and submit answers to all questions. Each set awards 10, 15, 25, or 40 points for the first 1, 2, 3, or 4 consecutive correct answers, for a maximum of 80 points across both sets." }
  ],
  awards: [
    { title: "Individual Awards", description: "The top 10 students in each grade level receive individual awards. Individual rankings are based solely on each student's Individual Round score." },
    { title: "Team Awards", description: "Team awards are presented separately for FSA teams and visiting teams. The top 5 FSA teams and the top 10 visiting teams receive awards." }
  ],
  teamScoring: ["The Individual Round scores of all four team members", "The Team Round score", "The Relay Round score"],
  contactNote: "Contact Fulton Science Academy Mu Alpha Theta with competition questions.",
  pastTournaments: [
    {
      year: 2025,
      title: "2025 tournament",
      summary: "A look back at last year's Fulton Science Math Tournament. Photos, results, and awards will be shared here.",
      // Photos: { src: '/assets/tournaments/2025/photo.jpg', alt: 'Describe the photo', caption: 'Optional caption' }
      photos: [],
      // Results: { category: 'Round or grade', placement: 'Place', participant: 'Public display name', score: 'Optional score' }
      results: [],
      // Awards: { title: 'Award name', recipient: 'Public display name', description: 'Optional details' }
      awards: []
    }
  ],
  news: [
    {
      id: "competition-details",
      category: "Competition update",
      date: null,
      title: "New tournament date: October 31, 2026.",
      summary: "The tournament has been postponed three weeks to October 31 due to Hurricane Isaias and other conflicting activities. Registration is open through October 29.",
      paragraphs: [
        "The Fulton Science Math Tournament has been postponed three weeks to October 31, 2026 due to Hurricane Isaias and other conflicting activities. We apologize for this change.",
        "If you already submitted the registration form and received a confirmation email, we have sent you an additional email with more information.",
        "The tournament takes place in the Fulton Science Academy Cafeteria, 3035 Fanfare Way, Alpharetta, GA 30009. Check-in opens at 8:30 AM and the competition begins at 9:00 AM, with the award ceremony at about 12:00 PM.",
        "Registration is open until October 29 at 11:59 PM. The cost is $25 per person or $100 for a team of 4. More details will be sent by email close to the competition date."
      ]
    },
    {
      id: "how-to-register",
      category: "For families",
      date: null,
      title: "Register as an individual or a team of four.",
      summary: "One form registers one student or a whole team of four. Only one form should be submitted per team.",
      paragraphs: [
        "Use the registration form linked on the Registration page. Choose Individual to register one student, or Team to register all four team members on a single form.",
        "Only one registration form should be submitted per team. Students who register individually will be placed on a team by the organizer.",
        "After you submit the form, Google Forms emails a copy of your answers to the address you entered. Then pay on the school's donation website and keep the receipt. Payment is confirmed separately by the organizer.",
        "Student names and parent contact details are visible only to the organizers. They are not published on this website."
      ]
    }
  ],
  faqs: [
    { question: "Who can participate?", answer: "The competition is for students currently in grades 3, 4, or 5." },
    { question: "When and where is the competition?", answer: "The Fulton Science Math Tournament takes place on October 31, 2026 in the Fulton Science Academy Cafeteria, 3035 Fanfare Way, Alpharetta, GA 30009. It was postponed three weeks due to Hurricane Isaias and other conflicting activities." },
    { question: "What is the schedule?", answer: "Check-in opens at 8:30 AM and the competition begins at 9:00 AM. The competition ends at about 11:30 AM with a break for students, and the award ceremony starts at about 12:00 PM. More details will be sent by email close to the competition date." },
    { question: "What is the competition format?", answer: "There are three rounds. In the Individual Round, students solve 25 problems in 40 minutes. In the Team Round, teams of four solve 10 problems in 20 minutes. In the Relay Round, teams complete two sets of four connected problems, with 10 minutes per set. See the Competition page for scoring details." },
    { question: "How are awards decided?", answer: "The top 10 students in each grade receive individual awards, based only on Individual Round scores. Team awards go to the top 5 FSA teams and the top 10 visiting teams, ranked by the team's total: all four members' Individual Round scores plus the Team Round and Relay Round scores." },
    { question: "Who organizes the tournament?", answer: "The tournament is organized by Fulton Science Academy Mu Alpha Theta." },
    { question: "How much does it cost?", answer: "The cost is $25 per person or $100 for a team of 4. Payment takes place through the school's donation website after registration." },
    { question: "How do I register a team?", answer: "Choose Team on the registration form and enter all four team members. One form registers the whole team, so only one form should be submitted per team." },
    { question: "What if my student does not have a team?", answer: "Choose Individual on the registration form. The organizer will place individually registered students on a team, so you do not need a complete team before registering." },
    { question: "Will I receive a confirmation email?", answer: "Yes. After you submit the registration form, Google Forms emails a copy of your answers to the address you entered. If it does not arrive, check your spam folder or contact fsmt@fultonscienceacademy.org with the parent or guardian name used on the form." },
    { question: "Where do I pay the registration fee?", answer: "After submitting the registration form, use the donation button on the Registration page to pay $25 per person or $100 for a team of 4 on the school's donation website. Include the parent or guardian name and the student names in the notes field if there is one, and keep the payment receipt from the school." },
    { question: "Does submitting the form mean payment is confirmed?", answer: "No. Submitting the form records the registration. Payment is handled by the school and confirmed separately by the organizer." },
    { question: "Who can see my registration details?", answer: "Only the organizing team. Student names, schools, and parent or guardian contact information are kept in the organizer's private registration records and are not published on this website." },
    { question: "Do I have to allow photos and videos?", answer: "No. Photo and media permission is optional. If you have parent or guardian permission for every student in your registration, you can allow the organizer to take photos and videos during the tournament and publish them on school or tournament websites, social media, newsletters, and promotional materials. Choose no if you do not give permission for every student. Students can still participate. Contact the organizer to update your choice." },
    { question: "How can I correct or cancel a registration?", answer: "Contact the organizer with the parent or guardian name and student names used on the form. The organizer can correct or remove the registration." }
  ]
};
