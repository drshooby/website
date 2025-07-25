export const projects = [
  {
    title: "Total",
    date: "June 2025 – Present",
    description: [
      "Minimalist web expense tracker syncing transactions directly from bank accounts.",
      "Provides flexible viewing and aggregation of transactions, customizable to each user’s needs.",
      "Currently focused on enhancing security features and optimizing database operations for reliability and performance."
    ],
    techTags: ["TypeScript", "React", "Next.js", "Prisma", "PostgreSQL", "Plaid API", "Encryption"],
    awesomePeople: [
      { name: "Edward", type: "personal", href: "https://edwardshturman.com/" },
      { name: "Cal", type: "personal", href: "https://calum-crawford.com/" }
    ]
  },
  {
    title: "Blink",
    date: "Jan 2025 – May 2025",
    description: [
      "Built a browser-based System Design game for our Senior Capstone Project.",
      "Designed and implemented a smooth level selection interface.",
      "Created a reusable animated progress bar to track player level progress.",
      "Developed UI animations to enhance engagement and responsiveness.",
    ],
    techTags: ["Godot", "WASM", "GDScript", "Tweening"],
    demo: { src: "blink-demo.mp4" },
    awesomePeople: [
      { name: "Edward", type: "personal", href: "https://edwardshturman.com/" },
      { name: "Cal", type: "personal", href: "https://calum-crawford.com/" },
      { name: "Karl", type: "linkedin", href: "https://linkedin.com/in/karl-hu-josefsson-95998a300/"}
    ]
  },
  {
    title: "Production-Grade Blue/Green Deployment Pipeline",
    date: "Apr 2025 – May 2025",
    description: [
      "Built and deployed scalable AWS infrastructure using Terraform, EKS, and GitHub Actions.",
      "Managed three FastAPI microservices across QA, UAT, and Prod environments.",
      "Configured RDS, ECR, TLS with Cert Manager, and secrets via Cluster Secret Store.",
      "Automated blue/green deployments using Argo Rollouts and Bash scripting.",
    ],
    techTags: ["Terraform", "AWS", "FastAPI", "GitHub Actions", "Kubernetes", "Helm", "Argo Rollouts", "Bash"],
    demo: { src: "bg-repos-pic.png", alt: "blue/green deployment services picture", github: "https://github.com/drshooby/devops-final-infra"}
  },
  {
    title: "Blueprint",
    date: "Apr 2025",
    description: [
      "Won \"Most Innovative\" at DonsHack ‘25 and received a $500 micro-grant.",
      "Built a web tool to help USF students map degree progress and visualize co/prerequisites."
    ],
    techTags: ["Python", "PostgreSQL", "React", "Next.js"],
    demo: { src: "blueprint-montage.mp4", github: "https://github.com/compsigh/blueprint" },
    awesomePeople: [
      { name: "Edward", type: "personal", href: "https://edwardshturman.com/" },
      { name: "Cal", type: "personal", href: "https://calum-crawford.com/" },
      { name: "Jet", type: "personal", href: "https://jetpham.com/"}
    ]
  },
  {
    title: "Veil",
    date: "Nov 2024",
    description: [
      "Won 2nd Place at the USF Deploy/24 Hackathon and received a $500 micro-grant.",
      "Built an accessible full-stack app using object detection to locate and blur faces in videos for privacy and anonymity."
    ],
    techTags: ["Python", "OpenCV", "Flask", "React", "Next.js", "Video Processing"],
    demo: { src: "veil-demo.mp4", github: "https://github.com/drshooby/Veil" },
    awesomePeople: [
      { name: "Andrew", type: "linkedin", href: "https://linkedin.com/in/andrew-diep-96b74a244/" },
      { name: "Peter (demo)", type: "linkedin", href: "https://linkedin.com/in/peter-regalbuto/" }
    ]
  }, 
  {
    title: "Ethical Web Crawler and Search Engine",
    date: "Aug 2023 – Dec 2023",
    description: [
      "Developed a web crawler in Go that respects robots.txt, includes rate limiting, and stores crawled HTML pages in a SQLite database.",
      "Built a basic search engine using TF-IDF to rank and return relevant results from the indexed pages."
    ],
    techTags: ["Go", "HTML", "CSS", "SQLite"],
    demo: { src: "search-engine-pic.png", alt: "search engine picture", github: "https://github.com/drshooby/search-engine"}
  }
];