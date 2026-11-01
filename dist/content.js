// Edit this file through Codex to publish competition details, news, FAQs, and past tournaments.
// These are public settings. Never add credentials or registration records here.
import { photos2026 } from './photos-2026.js';

export const site = {
  name: "Fulton Science Math Tournament",
  shortName: "FSMT Fall 2026",
  organizer: "Fulton Science Academy Mu Alpha Theta",
  tagline: "Fulton Science Math Tournament for grades 3–5",
  description: "Thank you to every student, family, school, and volunteer who joined FSMT Fall 2026. Explore the team and individual award winners below.",
  registrationOpen: false,
  registrationFormUrl: "",
  date: "October 31, 2026",
  dateNotice: "FSMT Fall 2026 took place on October 31, 2026. The award winners are listed on the homepage.",
  format: "Individual, Team, and Relay",
  teamFormation: "Register as an individual or as a team of four. A team registers all four members on one form. Students who register individually will be placed on a team by the organizer.",
  time: "Check-in opens 8:30 AM · Competition begins 9:00 AM",
  location: "Fulton Science Academy Cafeteria, 3035 Fanfare Way, Alpharetta, GA 30009",
  deadline: "October 29, 2026 at 11:59 PM",
  fee: "$25 per person · $100 for a team of 4",
  donationUrl: "https://www.givecampus.com/schools/FultonScienceAcademyPrivateSchool/events/fsmt-fall-2026",
  donationInstructions: "If the donation page has a notes field, include the parent or guardian name and the student names from your registration so the organizer can match your payment.",
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
    { title: "Team Awards", description: "Team awards are presented separately for FSA teams and visiting and mixed-school teams. See the awarded teams and their members on the homepage." }
  ],
  teamScoring: ["The Individual Round scores of all four team members", "The Team Round score", "The Relay Round score"],
  contactNote: "Contact Fulton Science Academy Mu Alpha Theta with competition questions.",
  pastTournaments: [
    {
      year: 2026,
      title: "Fall 2026",
      summary: "The Fall 2026 tournament took place on October 31 at Fulton Science Academy. Explore the round problems, award winners, and photo gallery.",
      problems: [
        { title: "Individual Round", detail: "25 problems · 8-page PDF", href: "/assets/tournaments/2026/individual-round.pdf" },
        { title: "Team Round", detail: "10 problems · 4-page PDF", href: "/assets/tournaments/2026/team-round.pdf" },
        { title: "Relay Round", detail: "Rounds 1 and 2 · 4-page PDF", href: "/assets/tournaments/2026/relay-round.pdf" }
      ],
      photos: photos2026,
      results: [],
      awards: []
    },
    {
      year: 2025,
      title: "2025",
      summary: "Photos, results, and awards from the 2025 tournament will be posted as they are shared.",
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
      id: "fall-2026-awards",
      category: "Tournament results",
      date: "2026-10-31",
      title: "Congratulations to the FSMT Fall 2026 award winners",
      summary: "Team and individual award winners are now featured on the homepage.",
      paragraphs: [
        "Thank you to the students, families, schools, and volunteers who made the tournament possible.",
        "The homepage lists team awards in the Visiting & Mixed-School and FSA divisions, followed by individual awards for grades 3, 4, and 5."
      ]
    }
  ],
  faqs: [
    { question: "Who can participate?", answer: "FSMT Fall 2026 is for students currently in grades 3, 4, or 5." },
    { question: "When and where was the competition?", answer: "FSMT Fall 2026 took place on October 31, 2026 in the Fulton Science Academy Cafeteria, 3035 Fanfare Way, Alpharetta, GA 30009." },
    { question: "What is the competition format?", answer: "There are three rounds. In the Individual Round, students solve 25 problems in 40 minutes. In the Team Round, teams of four solve 10 problems in 20 minutes. In the Relay Round, teams complete two sets of four connected problems, with 10 minutes per set. See the Competition page for scoring details." },
    { question: "How were awards decided?", answer: "The top 10 students in each grade received individual awards based on Individual Round scores. Team awards were ranked by the team's total: all four members' Individual Round scores plus the Team Round and Relay Round scores. The awarded teams are listed on the homepage." },
    { question: "Who organizes the tournament?", answer: "The tournament is organized by Fulton Science Academy Mu Alpha Theta." },
    { question: "How can I request a correction to an award listing?", answer: "Email fsmt@fultonscienceacademy.org with the name and listing that needs correction." }
  ]
};
