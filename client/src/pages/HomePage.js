import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Users, BarChart3 } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: <Search size={24} />,
      title: 'Link Verification',
      description: 'Instantly check the credibility of news articles and information sources with our advanced verification system.'
    },
    {
      icon: <Shield size={24} />,
      title: 'Reliable Sources',
      description: 'Get information from trusted news outlets and fact-checking organizations to ensure accuracy.'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Credibility Scoring',
      description: 'Receive detailed credibility scores and analysis to help you make informed decisions about information.'
    },
    {
      icon: <Users size={24} />,
      title: 'Community Driven',
      description: 'Join a community of fact-checkers and contribute to fighting misinformation together.'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Fight Misinformation with FactCheck
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Verify the credibility of news and information sources instantly.
            Join the fight against fake news and misinformation.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-12 text-gray-900 dark:text-white">
            Why Choose FactCheck?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm hover:-translate-y-1 transition-transform duration-200 text-center"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
