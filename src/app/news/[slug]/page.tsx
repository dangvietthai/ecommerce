'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { useParams } from 'next/navigation';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  image_url: string;
  category: string;
  author: string;
  published_at: string;
  read_time: number;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  published_at: string;
}

export default function ArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [params.slug]);

  const fetchArticle = async () => {
    try {
      const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (error) throw error;

      setArticle(article);

      // Fetch related articles
      const { data: related } = await supabase
        .from('articles')
        .select('id, title, slug, image_url, published_at')
        .eq('category', article.category)
        .neq('id', article.id)
        .limit(3);

      setRelatedArticles(related || []);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = article?.title || '';

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`, '_blank');
        break;
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="aspect-video bg-gray-200 rounded-lg mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bài viết không tồn tại</h1>
          <Link href="/news" className="text-red-600 hover:text-red-700">
            Quay lại trang tin tức
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-red-600">Trang chủ</Link>
        <span>/</span>
        <Link href="/news" className="hover:text-red-600">Tin tức</Link>
        <span>/</span>
        <span className="text-gray-400">{article.title}</span>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(article.published_at).toLocaleDateString('vi-VN')}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {article.read_time} phút đọc
            </div>
            <div>
              Tác giả: <span className="font-medium">{article.author}</span>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 mr-2">Chia sẻ:</span>
            <button
              onClick={() => handleShare('facebook')}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
            >
              <Facebook className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="p-2 text-blue-400 hover:bg-blue-50 rounded-full"
            >
              <Twitter className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="p-2 text-blue-700 hover:bg-blue-50 rounded-full"
            >
              <Linkedin className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Article Content */}
        <div 
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                    <Image
                      src={article.image_url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-600 mb-2">
                    {article.title}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {new Date(article.published_at).toLocaleDateString('vi-VN')}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
} 