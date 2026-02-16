export const projects = [
  // {
  //   title: "Total",
  //   date: "June 2025 – Present",
  //   description: [
  //     "Minimalist web expense tracker syncing transactions directly from bank accounts.",
  //     "Provides flexible viewing and aggregation of transactions, customizable to each user’s needs.",
  //     "Currently focused on enhancing security features and optimizing database operations for reliability and performance."
  //   ],
  //   techTags: ["TypeScript", "React", "Next.js", "Prisma", "PostgreSQL", "Plaid API", "Encryption"],
  //   awesomePeople: [
  //     { name: "Edward", type: "personal", href: "https://edwardshturman.com/" },
  //     { name: "Cal", type: "personal", href: "https://calum-crawford.com/" }
  //   ],
  //   inProgress: true
  // },
  {
    title: "Radiant",
    date: "Nov 2025",
    description: [
      "Radiant is a serverless tool that automatically creates Valorant montages from long clips. It uses AWS Lambda and Step Functions to orchestrate the entire pipeline, from uploading gameplay footage to delivering a finished edit.",
      "AWS Rekognition detects kill events, and FFmpeg handles the cutting, merging, and crossfade transitions. There's also an AI commentary track powered by Amazon Bedrock and Polly.",
      "The front-end is a static site hosted on S3 behind Cloudflare CDN, with user auth handled by Cognito and persistent data stored in RDS."
    ],
    techTags: ["AWS", "Serverless", "Video Editing", "Machine Learning", "Lambda Orchestration"],
    demo: { src: "val-edit-radiant.mp4", github: "https://github.com/drshooby/radiant", writeup: "radiant"},
    awesomePeople: [
      { name: "Jayden (gameplay)", type: "linkedin", href: "https://www.linkedin.com/in/jaydenjchin/"}
    ],
    inProgress: false
  },
  {
    title: "Blink",
    date: "Jan 2025 — May 2025",
    description: [
      "Blink is a browser-based System Design game we built for our Senior Capstone Project. Players work through levels that teach system design concepts in an interactive, visual way.",
      "I focused on the logic for our front-end experience — designing a smooth level selection interface, building an animated progress bar, and developing UI animations to keep things feeling responsive and engaging. The game runs entirely in the browser via WebAssembly.",
      "Play it [here](https://blink.rahoi.com/)!"
    ],
    techTags: ["Godot", "WASM", "GDScript", "Tweening"],
    demo: { src: "blink-demo.mp4" },
    awesomePeople: [
      { name: "Edward", type: "personal", href: "https://edwardshturman.com/" },
      { name: "Cal", type: "personal", href: "https://calum-crawford.com/" },
      { name: "Karl", type: "linkedin", href: "https://linkedin.com/in/karl-hu-josefsson-95998a300/"}
    ],
    inProgress: false
  },
  {
    title: "EKS Blue/Green Deployment Pipeline",
    date: "Apr 2025 – May 2025",
    description: [
      "A deployment pipeline built on AWS EKS and EC2 with Terraform. Three FastAPI microservices run across QA, UAT, and Prod environments, with GitHub Actions handling CI/CD.",
      "Infrastructure includes RDS, ECR, TLS via Cert Manager, and secrets managed through Cluster Secret Store. Blue/green deployments are automated with Argo Rollouts and custom Bash scripting."
    ],
    techTags: ["Terraform", "AWS", "FastAPI", "GitHub Actions", "Kubernetes", "Helm", "Argo Rollouts", "Bash"],
    demo: { src: "argo-pic.png", alt: "blue/green deployment services picture", github: "https://github.com/drshooby/devops-final-infra"},
    inProgress: false
  },
  {
    title: "Blueprint",
    date: "Apr 2025",
    description: [
      "Blueprint won \"Most Innovative\" at DonsHack '25 and received a $500 micro-grant.",
      "Degree tracking is often fragmented and confusing. Blueprint simplifies the academic journey for USF students by providing an intuitive way to visualize and navigate complex course dependencies."
    ],
    techTags: ["Python", "PostgreSQL", "React", "Next.js"],
    demo: { src: "blueprint-montage.mp4", github: "https://github.com/compsigh/blueprint" },
    awesomePeople: [
      { name: "Edward", type: "personal", href: "https://edwardshturman.com/" },
      { name: "Cal", type: "personal", href: "https://calum-crawford.com/" },
      { name: "Jet", type: "personal", href: "https://jetpham.com/"}
    ],
    inProgress: false
  },
  {
    title: "Veil",
    date: "Nov 2024",
    description: [
      "Veil took 2nd Place at the USF Deploy/24 Hackathon and received a $500 micro-grant. ",
      "A full-stack app utilizing object detection to locate and blur faces in videos. Built for privacy, anonymity, and accessibility."
    ],
    techTags: ["Python", "OpenCV", "Flask", "React", "Next.js", "Video Processing"],
    demo: { src: "veil-demo.mp4", github: "https://github.com/drshooby/Veil" },
    awesomePeople: [
      { name: "Andrew", type: "linkedin", href: "https://linkedin.com/in/andrew-diep-96b74a244/" },
      { name: "Peter (demo)", type: "linkedin", href: "https://linkedin.com/in/peter-regalbuto/" }
    ],
    inProgress: false
  },
];