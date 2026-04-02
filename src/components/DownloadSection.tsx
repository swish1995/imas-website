import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: ReleaseAsset[];
}

const REPO = 'swish1995/Skeleton_analyzer';

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function DownloadSection() {
  const [latest, setLatest] = useState<Release | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReleases() {
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases`);
        if (!res.ok) throw new Error('GitHub API 응답 오류');
        const data: Release[] = await res.json();
        if (data.length > 0) {
          setLatest(data[0]);
          setReleases(data.slice(1, 6));
        }
      } catch (e) {
        setError('릴리즈 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchReleases();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        릴리즈 정보를 불러오는 중...
      </div>
    );
  }

  if (error || !latest) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{error || '릴리즈 정보가 없습니다.'}</p>
        <a href={`https://github.com/${REPO}/releases`} target="_blank" rel="noopener">
          <Button variant="outline">GitHub에서 직접 다운로드</Button>
        </a>
      </div>
    );
  }

  const windowsAsset = latest.assets.find(
    (a) => a.name.toLowerCase().includes('windows') || a.name.endsWith('.exe') || a.name.endsWith('.msi')
  );

  return (
    <div className="space-y-12">
      {/* Latest Release */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Badge className="bg-[#4a9eff] text-white border-0">최신 버전</Badge>
          <span className="text-2xl font-bold">{latest.tag_name}</span>
        </div>
        {windowsAsset ? (
          <a href={windowsAsset.browser_download_url} className="block">
            <Button className="h-16 w-full text-xl font-semibold bg-[#4a9eff] hover:bg-[#3a8eef] text-white shadow-lg shadow-[#4a9eff]/25">
              다운로드 ({formatSize(windowsAsset.size)})
            </Button>
          </a>
        ) : (
          <a href={latest.html_url} target="_blank" rel="noopener" className="block">
            <Button className="h-16 w-full text-xl font-semibold bg-[#4a9eff] hover:bg-[#3a8eef] text-white shadow-lg shadow-[#4a9eff]/25">
              GitHub에서 다운로드
            </Button>
          </a>
        )}
        <p className="text-sm text-muted-foreground">Windows 10/11 지원</p>
      </div>

      {/* System Requirements */}
      <div>
        <h3 className="text-xl font-bold mb-6">시스템 요구사항</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">최소 사양</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>OS: Windows 10 이상</li>
                <li>CPU: 듀얼코어</li>
                <li>RAM: 4GB</li>
                <li>저장공간: 500MB</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-[#4a9eff]/30 bg-[#4a9eff]/5">
            <CardHeader>
              <CardTitle className="text-base text-[#4a9eff]">권장 사양</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>OS: Windows 10/11</li>
                <li>CPU: 쿼드코어</li>
                <li>RAM: 8GB</li>
                <li>GPU: CUDA 지원 (선택)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
