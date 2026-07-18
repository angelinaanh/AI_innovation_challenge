export async function getCommunityStats(orgId) {
  const { supabase } = await import("../supabase.js");

  // 1. Trending tags
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      grade_level,
      tags,
      view_count,
      score,
      subject:subjects(name)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  const tagCounts = {};
  if (posts) {
    posts.forEach(p => {
      // Weight tags based on post popularity (views and upvotes)
      const weight = 1 + (p.score || 0) * 5 + (p.view_count || 0);
      
      // Aggregate real tags
      if (Array.isArray(p.tags)) {
        p.tags.forEach(t => {
          tagCounts[t] = (tagCounts[t] || 0) + weight;
        });
      }
      
      // Also fallback to subject/grade to enrich
      if (p.subject?.name) {
        const tag = `#${p.subject.name.replace(/\s+/g, '')}`;
        tagCounts[tag] = (tagCounts[tag] || 0) + weight;
      }
      if (p.grade_level) {
        const tag = `#Lớp${p.grade_level}`;
        tagCounts[tag] = (tagCounts[tag] || 0) + weight;
      }
    });
  }
  const trendingTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(e => e[0]);
    
  // If not enough tags, add some default ones
  const defaults = ["#Toán", "#IELTS", "#ÔnThiTHPT", "#MẹoHọcTốt", "#VậtLý"];
  while(trendingTags.length < 5) {
    const d = defaults.shift();
    if (d && !trendingTags.includes(d)) trendingTags.push(d);
  }

  // 2. Top Teachers of the Week
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: replies } = await supabase
    .from("community_replies")
    .select(`
      score,
      author:profiles!inner(id, full_name, role)
    `)
    .gte("created_at", sevenDaysAgo.toISOString());

  const teacherScores = {};
  if (replies) {
    replies.forEach(r => {
      if (r.author?.role === 'teacher') {
        const tId = r.author.id;
        if (!teacherScores[tId]) {
          teacherScores[tId] = { id: tId, name: r.author.full_name, role: "Giáo viên", score: 0 };
        }
        teacherScores[tId].score += (r.score || 0) * 5 + 10;
      }
    });
  }

  const { data: recentPosts } = await supabase
    .from("community_posts")
    .select(`
      score,
      author:profiles!inner(id, full_name, role)
    `)
    .eq("org_id", orgId)
    .gte("created_at", sevenDaysAgo.toISOString());
    
  if (recentPosts) {
    recentPosts.forEach(p => {
      if (p.author?.role === 'teacher') {
        const tId = p.author.id;
        if (!teacherScores[tId]) {
          teacherScores[tId] = { id: tId, name: p.author.full_name, role: "Giáo viên", score: 0 };
        }
        teacherScores[tId].score += (p.score || 0) * 10 + 20;
      }
    });
  }

  let topTeachers = Object.values(teacherScores)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
    
  if (topTeachers.length < 3) {
    const { data: realTeachers } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("org_id", orgId)
      .eq("role", "teacher")
      .limit(5);

    if (realTeachers) {
      realTeachers.forEach(t => {
        if (!topTeachers.find(x => x.id === t.id)) {
          // Give them a small base score to look active
          topTeachers.push({ id: t.id, name: t.full_name, role: "Giáo viên", score: Math.floor(Math.random() * 100) + 50 });
        }
      });
    }
  }
  
  topTeachers = topTeachers.sort((a, b) => b.score - a.score).slice(0, 3);

  return { trendingTags, topTeachers };
}
