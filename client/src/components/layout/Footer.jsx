import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">Amazon Product Synthesis</h3>
            <p className="text-primary-200 text-sm mt-2">
              Comprehensive analysis for Amazon products
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:space-x-8 text-center md:text-left">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold mb-2">Links</h4>
              <ul className="space-y-1">
                <li>
                  <a
                    href="/"
                    className="text-primary-200 hover:text-white transition-colors duration-200"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/history"
                    className="text-primary-200 hover:text-white transition-colors duration-200"
                  >
                    History
                  </a>
                </li>
              </ul>
            </div>{" "}
            <div>
              <h4 className="text-lg font-semibold mb-2">Support</h4>
              <ul className="space-y-1">
                <li>
                  <button className="text-primary-200 hover:text-white transition-colors duration-200 text-left">
                    Contact
                  </button>
                </li>
                <li>
                  <button className="text-primary-200 hover:text-white transition-colors duration-200 text-left">
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-600 mt-6 pt-6 text-center">
          <p className="text-primary-200 text-sm">
            &copy; {currentYear} Amazon Product Synthesis Tool. All rights
            reserved.
          </p>{" "}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
