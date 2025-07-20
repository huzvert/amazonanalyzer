import HuzaifaImage from "../assets/huzaifa.jpg";
import PageTransition from "../components/common/PageTransition";

const AboutUs = () => {
  const teamMembers = [
    {
      name: "Huzaifa Ali Satti",
      role: "Huzaifa Ali Satti — Developer",
      bio: "Developer and creator of Amazon Product Synthesis platform",
      image: HuzaifaImage,
      github: "https://github.com/huzvert",
      linkedin: "https://linkedin.com/in/huziskrrt",
    },
  ];

  const milestones = [
    { date: "Week 1", task: "Set up repo, login logic, and Amazon cookies" },
    { date: "Week 2", task: "Built product & review scraper with MongoDB backend" },
    { date: "Week 3", task: "Added vector storage and embeddings for RAG" },
    { date: "Week 4", task: "Wrote RAG analysis and integrated the API flow" },
    { date: "Week 5", task: "Handled scraper errors, parallelization, and robustness" },
    { date: "Week 6", task: "Polished UI/UX, added final touches and deployed" },
  ];

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-xl overflow-hidden shadow-xl mb-12">
          <div className="px-8 py-20 text-center relative">
            <div className="absolute inset-0 opacity-10 bg-pattern"></div>
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                About Amazon Product Synthesis
              </h1>
              <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
                We help businesses make data-driven decisions with advanced AI-powered product analysis
              </p>
            </div>
          </div>
        </div>

        {/* Our Team */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-600 mb-4">Meet Our Team</h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Meet the developer behind this project.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="bg-white rounded-xl shadow-md overflow-hidden group border border-gray-200 flex flex-col items-center">
              <div className="relative h-64 w-64 overflow-hidden flex justify-center items-center">
                <img
                  src={teamMembers[0].image}
                  alt={teamMembers[0].name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center' }}
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800">{teamMembers[0].name}</h3>
                <p className="text-primary-600 mt-2">{teamMembers[0].role}</p>
                <div className="flex justify-center space-x-4 mt-4">
                  <a href={teamMembers[0].github} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    GitHub
                  </a>
                  <a href={teamMembers[0].linkedin} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Timeline */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-600 mb-4">Our Journey</h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto mb-6"></div>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>
            {milestones.map((milestone, index) => (
              <div key={index} className="relative mb-12 md:mb-20">
                <div className="md:flex items-center">
                  <div className="hidden md:block w-1/2 pr-16">
                    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary-500 text-right">
                      <h3 className="text-2xl font-bold text-primary-600 mb-2">
                        <span className="font-extrabold">{milestone.date}</span>
                      </h3>
                      <p className="text-gray-600">{milestone.task}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                    <div className="bg-primary-600 text-white rounded-full h-14 w-14 flex items-center justify-center text-xl font-bold shadow-md">
                      {/* Empty circle, no week label inside */}
                    </div>
                  </div>
                  <div className="md:w-1/2 order-1 md:pl-16">
                    <div className="md:hidden flex mb-4">
                      <div className="bg-primary-600 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-bold shadow-md mr-4">
                        {/* Empty circle, no week label inside */}
                      </div>
                      <h3 className="text-xl font-bold text-primary-600 flex items-center">
                        <span className="font-extrabold">{milestone.date}</span>
                      </h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary-500 md:hidden">
                      <p className="text-gray-600">{milestone.task}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12 border border-gray-200">
          <div className="md:flex">
            <div className="md:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 text-white">
              <h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
              <p className="mb-8 text-white opacity-90">
                Have questions about the project or want to collaborate? Reach out below.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span>yeehuzz@gmail.com</span>
                </div>
                <div className="flex items-start">
                  <span>+92 315 4998318</span>
                </div>
                <div className="flex items-start">
                  <span>SEECS, NUST H-12, Islamabad, Pakistan</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 p-12 bg-gray-50">
              <h3 className="text-2xl font-bold text-primary-600 mb-6">Send Me a Message</h3>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">Your Name</label>
                  <input type="text" id="name" className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                  <input type="email" id="email" className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-600 mb-1">Message</label>
                  <textarea id="message" rows="4" className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md"></textarea>
                </div>
                <button type="submit" className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AboutUs;
