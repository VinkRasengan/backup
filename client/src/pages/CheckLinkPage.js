import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search, ExternalLink, Calendar, User, Globe, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = yup.object({
  url: yup
    .string()
    .url('Please enter a valid URL')
    .required('URL is required')
});

// Helper functions for styling
const getCredibilityBadgeClasses = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (score >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

const getSourceCredibilityClasses = (level) => {
  if (level === 'high') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (level === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

const CheckLinkPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Mock response for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

      const mockResult = {
        url: data.url,
        credibilityScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
        metadata: {
          title: 'Sample Article Title',
          domain: new URL(data.url).hostname,
          publishDate: new Date().toISOString(),
          author: 'Sample Author'
        },
        summary: 'This is a demo analysis. The actual fact-checking functionality would analyze the content, sources, and credibility indicators to provide a comprehensive assessment.',
        sources: [
          {
            name: 'Reliable News Source',
            url: 'https://example.com/source1',
            credibility: 'high'
          },
          {
            name: 'Secondary Source',
            url: 'https://example.com/source2',
            credibility: 'medium'
          }
        ]
      };

      setResult(mockResult);
      toast.success('Link checked successfully!');
    } catch (error) {
      console.error('Error checking link:', error);
      toast.error('Failed to check link');
    } finally {
      setIsLoading(false);
    }
  };

  const getCredibilityIcon = (score) => {
    if (score >= 80) return <CheckCircle size={20} />;
    if (score >= 40) return <AlertTriangle size={20} />;
    return <XCircle size={20} />;
  };

  const getCredibilityText = (score) => {
    if (score >= 80) return 'High Credibility';
    if (score >= 60) return 'Good Credibility';
    if (score >= 40) return 'Moderate Credibility';
    return 'Low Credibility';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Check Link Credibility
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Enter a URL to verify the credibility of news articles and information sources
        </p>
      </div>

      {/* Check Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm mb-8">
        <div className="mb-6">
          <label htmlFor="url" className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL to Check
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Globe size={20} />
            </div>
            <input
              id="url"
              type="url"
              placeholder="https://example.com/article"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg text-base transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.url
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
              } focus:outline-none focus:ring-3 focus:ring-blue-500/10`}
              {...register('url')}
            />
          </div>
          {errors.url && (
            <span className="text-red-500 text-sm mt-1 block">{errors.url.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Search size={20} />
              Check Link
            </>
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* Result Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-lg ${getCredibilityBadgeClasses(result.credibilityScore)}`}>
              {getCredibilityIcon(result.credibilityScore)}
              {result.credibilityScore}% - {getCredibilityText(result.credibilityScore)}
            </div>
          </div>

          {/* Result Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {result.metadata?.title}
            </h2>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <Globe size={16} />
                {result.metadata?.domain}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <Calendar size={16} />
                {result.metadata?.publishDate ?
                  new Date(result.metadata.publishDate).toLocaleDateString() :
                  'Date unknown'
                }
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <User size={16} />
                {result.metadata?.author || 'Author unknown'}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <ExternalLink size={16} />
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View Original
                </a>
              </div>
            </div>

            {/* Summary Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Analysis Summary
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Sources */}
            {result.sources && result.sources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Sources
                </h3>
                <div className="space-y-3">
                  {result.sources.map((source, index) => (
                    <div key={`${source.name}-${index}`} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {source.name}
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1"
                        >
                          {source.url} <ExternalLink size={12} />
                        </a>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getSourceCredibilityClasses(source.credibility.toLowerCase())}`}>
                        {source.credibility}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckLinkPage;
