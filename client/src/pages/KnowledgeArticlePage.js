import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import knowledgeArticlesService from '../services/knowledgeArticlesService';
import Loader from '../components/loader/9';

// Helper to format date
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return new Date(date).toLocaleString();
  if (date.toDate) return date.toDate().toLocaleString();
  return date.toLocaleString();
}

// Preprocess content to convert img:href:alt to markdown images with alt as caption
function preprocessContent(content) {
  if (!content) return '';
  // Convert img:link:alt or img:link to standard markdown image syntax
  return content.replace(/img:(\S+)(?::([^\n]+))?/g, (match, url, alt) => {
    return `![${alt || ''}](${url})`;
  });
}

const markdownStyles = {
  // Headings
  h1: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '2rem 0 1rem 0',
    color: '#000',
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: '2rem 0 1rem 0',
    color: '#000000',
    lineHeight: 1.2,
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    margin: '1.5rem 0 1rem 0',
    color: '#000000',
    lineHeight: 1.2,
  },
  p: {
    fontSize: '1.15rem',
    margin: '0.75rem 0',
    lineHeight: 1.7,
  },
  ul: {
    fontSize: '1.15rem',
    margin: '0.75rem 0 0.75rem 1.5rem',
    lineHeight: 1.7,
  },
  li: {
    marginBottom: '0.5rem',
  },
  img: {
    maxWidth: '80%',
    margin: '1.5rem 0',
    borderRadius: '0.5rem',
  },
};

// Custom renderer for markdown links and custom image tokens
const components = {
  a: ({ node, ...props }) => (
    <a {...props} style={{ color: '#4a0072' }} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  ),
  h1: ({ node, ...props }) => <h1 style={markdownStyles.h1} {...props} />,
  h2: ({ node, ...props }) => <h2 style={markdownStyles.h2} {...props} />,
  h3: ({ node, ...props }) => <h3 style={markdownStyles.h3} {...props} />,
  p: ({ node, children, ...props }) => {

    if (
      typeof children[0] === 'string' &&
      children[0].startsWith('[img-custom]:')
    ) {
      // Updated regex: alt is now optional
      const match = children[0].match(/^\[img-custom\]:(\S+):([^\n]*)/);
      if (match) {
        const url = match[1];
        const alt = match[2] || '';
        return (
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <img
              src={url}
              alt={alt}
              style={{
                maxWidth: '100%',
                margin: '0 auto',
                borderRadius: '0.5rem',
                display: 'block',
              }}
            />
            {alt && (
              <div style={{ fontStyle: 'italic', color: '#444', marginTop: '0.5rem' }}>{alt}</div>
            )}
          </div>
        );
      }
    }
    return <p style={markdownStyles.p} {...props}>{children}</p>;
  },
  ul: ({ node, ...props }) => <ul style={markdownStyles.ul} {...props} />,
  li: ({ node, ...props }) => <li style={markdownStyles.li} {...props} />,
  img: ({ node, ...props }) => (
    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
      <img style={markdownStyles.img} alt={props.alt} {...props} />
      {props.alt && (
        <div style={{ fontStyle: 'italic', color: '#444', marginTop: '0.5rem' }}>
          {props.alt}
        </div>
      )}
    </div>
  ),
};

const KnowledgeArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await knowledgeArticlesService.getArticleById(id);
        setArticle(data);
      } catch (err) {
        setArticle(null);
      }
    };
    fetchArticle();
  }, [id]);

  if (!article) return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%',
    }}>
      <Loader />
    </div>
  );

  return (
    <div className='bg-white'>
      <div className="ml-[100px] min-h-screen bg-white">
        {/* Quay lại button */}
        <div className="py-4 px-4">
          <button
            onClick={() => navigate('/knowledge/')}
            className="text-white px-4 py-2 rounded hover:bg-[#350052] transition"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #a259f7 100%)', // matches the blue-purple gradient
            }}
          >
            ← Quay lại
          </button>
        </div>
        {/* Header */}
        <div
          className="rounded-lg px-6 py-6 mb-8 flex flex-col gap-2"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #a259f7 100%)', // matches the blue-purple gradient
          }}
        >
          <div className="flex items-center justify-between">
            <span className="italic text-gray-100">{formatDate(article.createdAt)}</span>
            {article.author && (
              <span className="font-medium text-gray-100">
                {article.author.displayName || article.author.email || ''}
              </span>
            )}
          </div>
          <h1
            className="font-bold"
            style={{
              color: '#fff',
              fontSize: '2.5rem',
              lineHeight: 1.1,
              marginBottom: '0.5rem',
            }}
          >
            {article.title}
          </h1>
          <div
            className="font-bold"
            style={{
              color: '#fff',
              fontSize: '1.25rem',
              marginBottom: '0.5rem',
            }}
          >
            {article.description}
          </div>
        </div>
        {/* Content */}
        <div className="max-w-3xl mx-2 px-2 pb-12">
          <ReactMarkdown components={components}>
            {preprocessContent(article.content)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArticleDetailPage;