export const projects = [
  {
    title: "Total",
    date: "June 2025 – Present",
    description: [
      "Open source, minimalist web expense tracker syncing transactions directly from bank accounts.",
      "Provides flexible viewing and aggregation of transactions, customizable to each user’s needs.",
      "Currently focused on enhancing security features and optimizing database operations for reliability and performance."
    ],
    techTags: ["TypeScript", "React.js", "Next.js", "Prisma", "PostgreSQL", "Plaid API", "Encryption"]
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
    demo: { type: "video", src: "blink-demo.mp4" } as const
  },
  {
    title: "Production-Grade Blue/Green Deployment Pipeline",
    date: "Apr 2025 – May 2025",
    description: [
      "Built and deployed scalable AWS infrastructure using Terraform, EKS, and GitHub Actions.",
      "Managed three FastAPI microservices across QA, UAT, and Prod environments.",
      "Configured RDS, ECR, TLS with Cert Manager, and secrets via Cluster Secret Store.",
      "Automated blue/green deployments using Argo Rollouts and Shell scripting.",
    ],
    techTags: ["Terraform", "AWS", "FastAPI", "GitHub Actions", "Kubernetes", "Helm", "Argo Rollouts", "Scripting"],
  },
  {
    title: "Blueprint",
    date: "Apr 2025",
    description: [
      "Won \"Most Innovative\" at DonsHack ‘25 and received a $500 micro-grant.",
      "Built a web tool to help USF students map degree progress and visualize co/prerequisites."
    ],
    techTags: ["Python", "PostgreSQL", "React.js", "Next.js"],
    demo: { type: "video", src: "blueprint-montage.mp4" } as const
  },
  {
    title: "Veil",
    date: "Nov 2024",
    description: [
      "Won 2nd Place at the USF Deploy/24 Hackathon and received a $500 micro-grant.",
      "Built an accessible full-stack app using object detection to locate and blur faces in videos for privacy and anonymity."
    ],
    techTags: ["Python", "OpenCV", "Flask", "React.js", "Next.js"],
    demo: { type: "video", src: "veil-demo.mp4" } as const
  }, 
  {
    title: "Ethical Web Crawler and Search Engine",
    date: "Aug 2023 – Dec 2023",
    description: [
      "Developed a web crawler in Go that respects robots.txt, includes rate limiting, and stores crawled HTML pages in a SQLite database.",
      "Built a basic search engine using TF-IDF to rank and return relevant results from the indexed pages."
    ],
    techTags: ["Go", "HTML", "CSS", "SQLite"],
    demo: { type: "image", src: "search-engine-pic.png", alt: "search engine picture"} as const
  }
];