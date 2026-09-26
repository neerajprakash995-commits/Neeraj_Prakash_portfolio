import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const getBlock = (source, marker, startAt = 0) => {
  const markerIndex = source.indexOf(marker, startAt);
  assert.notEqual(markerIndex, -1, `missing CSS block: ${marker}`);
  const openingBrace = source.indexOf("{", markerIndex);
  assert.notEqual(openingBrace, -1, `missing opening brace for: ${marker}`);
  let depth = 0;

  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  assert.fail(`missing closing brace for: ${marker}`);
};

const [home, projects, blogs, archiveScript, archiveStyles, projectIndexSource] = await Promise.all([
  read("index.html"),
  read("projects.html"),
  read("blogs.html"),
  read("archive.js"),
  read("archive.css"),
  read("assets/projects/index.json"),
]);

assert.match(home, /href="projects\.html"[^>]*>\s*Projects\s*</i);
assert.match(home, /href="blogs\.html"[^>]*>\s*Blogs\s*</i);

assert.match(projects, /<body[^>]*class="[^"]*projects-page/i);
assert.match(projects, /<header class="site-header"/i);
assert.match(projects, /<nav class="nav-shell"/i);
assert.match(projects, /href="projects\.html"[^>]*aria-current="page"/i);
assert.doesNotMatch(projects, /id="archive-navigation"/i);
assert.match(projects, /class="project-intro"/i);
assert.match(projects, /<h1[^>]*>\s*Built to fly\.\s*<\/h1>/i);
assert.match(projects, /class="project-summary"/i);
assert.match(projects, /class="project-index-rail"/i);
assert.match(projects, /id="project-jump-list"/i);
assert.match(projects, /id="projects-grid"/i);
assert.doesNotMatch(projects, /class="archive-cta"/i);
assert.match(projects, /<footer class="site-footer"/i);
assert.match(projects, /class="footer-bottom"/i);
assert.match(projects, /<dialog class="[^"]*archive-lightbox/i);
assert.match(projects, /<script[^>]+src="archive\.js/i);

assert.match(blogs, /<body[^>]*class="[^"]*blogs-page/i);
assert.match(blogs, /<header class="site-header"/i);
assert.match(blogs, /<nav class="nav-shell"/i);
assert.match(blogs, /<h1[^>]*>\s*Field notes\.\s*<\/h1>/i);
assert.match(blogs, /id="mixed-journal"/i);
assert.match(blogs, /id="mixed-masonry"/i);
assert.match(blogs, /class="journal-filters"/i);
assert.match(blogs, /data-media-filter="all"/i);
assert.match(blogs, /data-media-filter="video"/i);
assert.match(blogs, /data-media-filter="photo"/i);
assert.doesNotMatch(blogs, /id="build-masonry"/i);
assert.match(blogs, /<footer class="site-footer"/i);
assert.match(blogs, /class="footer-bottom"/i);
assert.match(blogs, /<script[^>]+src="archive\.js/i);

assert.match(archiveScript, /assets\/projects\/index\.json/);
assert.match(archiveScript, /aria-expanded/);
assert.match(archiveScript, /Escape/);
assert.match(archiveScript, /prefers-reduced-motion/);
assert.match(archiveScript, /interleaveRecords/);
assert.match(archiveScript, /project-expand/);
assert.match(archiveScript, /project-active-view/);
assert.match(archiveScript, /dataset\.lightbox/);
assert.match(archiveScript, /dataset\.alt/);
assert.match(archiveScript, /blog-card-description/);
assert.match(archiveScript, /build-story-description/);
assert.match(archiveScript, /video\.autoplay\s*=\s*!reducedMotion/);
assert.match(archiveScript, /video\.play\(\)/);
assert.match(archiveScript, /data-media-filter/);
assert.match(getBlock(archiveStyles, ".mixed-masonry"), /column-count:\s*3/);
assert.match(archiveStyles, /\.project-intro\s*\{/);
assert.match(getBlock(archiveStyles, ".project-intro h1"), /font-size:\s*clamp\(3\.4rem,\s*6\.8vw,\s*6\.4rem\)/);
assert.match(getBlock(archiveStyles, ".projects-page .collection-heading h2"), /font-size:\s*clamp\(2\.1rem,\s*3\.8vw,\s*3\.9rem\)/);
assert.match(getBlock(archiveStyles, ".projects-page .project-entry h3"), /font-size:\s*clamp\(1\.65rem,\s*2\.4vw,\s*2\.75rem\)/);
assert.match(getBlock(archiveStyles, ".projects-page .project-entry-media img"), /object-fit:\s*contain/);
assert.match(getBlock(archiveStyles, ".projects-page .project-entry-media"), /min-height:\s*520px/);
assert.match(archiveStyles, /\.project-index-rail\s*\{/);
assert.match(getBlock(archiveStyles, ".home-chrome .site-header"), /background:\s*rgba\(11,\s*11,\s*12,\s*0\.9\)/);
assert.match(getBlock(archiveStyles, ".home-chrome .nav-shell"), /width:\s*min\(1380px,\s*calc\(100% - 56px\)\)/);
assert.match(getBlock(archiveStyles, ".home-chrome .nav-shell"), /height:\s*72px/);
assert.match(getBlock(archiveStyles, ".home-chrome .site-footer"), /border-top:\s*3px solid var\(--blue\)/);
assert.match(getBlock(archiveStyles, ".home-chrome .footer-shell,\n.home-chrome .footer-bottom"), /width:\s*min\(1360px,\s*calc\(100% - 56px\)\)/);
assert.match(getBlock(archiveStyles, ".mixed-card"), /clip-path:\s*polygon/);
assert.match(getBlock(archiveStyles, ".mixed-card:hover"), /translateY\(-/);
assert.match(getBlock(archiveStyles, ".journal-intro h1"), /font-size:\s*clamp\(3\.4rem,\s*6\.8vw,\s*6\.4rem\)/);
assert.match(getBlock(archiveStyles, ".mixed-journal-heading h2"), /font-size:\s*clamp\(2\.1rem,\s*3\.8vw,\s*3\.9rem\)/);
assert.match(getBlock(archiveStyles, ".mixed-card h3"), /font-size:\s*clamp\(1\.05rem,\s*1\.35vw,\s*1\.45rem\)/);
assert.match(getBlock(archiveStyles, ".mixed-card .blog-card-description"), /font-size:\s*0\.78rem/);
assert.match(getBlock(archiveStyles, ".video-action"), /font:\s*0\.64rem\/1/);

const tabletMediaStart = archiveStyles.lastIndexOf("@media (max-width: 1100px)");
const tabletMedia = getBlock(archiveStyles, "@media (max-width: 1100px)", tabletMediaStart);
assert.match(getBlock(tabletMedia, ".mixed-masonry"), /column-count:\s*2/);

const mobileMediaStart = archiveStyles.lastIndexOf("@media (max-width: 760px)");
const mobileMedia = getBlock(archiveStyles, "@media (max-width: 760px)", mobileMediaStart);
assert.match(getBlock(mobileMedia, ".journal-intro h1"), /font-size:\s*clamp\(2\.7rem,\s*11\.5vw,\s*3\.6rem\)/);
assert.match(getBlock(mobileMedia, ".project-intro h1"), /font-size:\s*clamp\(2\.7rem,\s*11\.5vw,\s*3\.6rem\)/);
assert.match(getBlock(mobileMedia, ".projects-page .project-entry-media"), /aspect-ratio:\s*4\s*\/\s*3/);
assert.match(getBlock(mobileMedia, ".mixed-masonry"), /column-count:\s*1/);

const projectIndex = JSON.parse(projectIndexSource);
assert.equal(projectIndex.length, 12, "the project page should load all 12 systems");

for (const metadataPath of projectIndex) {
  const metadataUrl = new URL(`../assets/projects/${metadataPath}`, import.meta.url);
  const metadata = JSON.parse(await readFile(metadataUrl, "utf8"));
  assert.ok(metadata.title, `${metadataPath} should have a title`);
  assert.ok(metadata.views.length >= 4, `${metadataPath} should expose at least four views`);
  await Promise.all(metadata.views.map((view) => access(new URL(view.image, metadataUrl))));
}

const videoAssets = [...archiveScript.matchAll(/video: "(assets\/showcase\/flight-proof\/[^"]+\.mp4)"/g)];
assert.equal(videoAssets.length, 11, "the blog should contain all 11 motion records");
await Promise.all(videoAssets.map(([, path]) => access(new URL(`../${path}`, import.meta.url))));

const buildAssets = [
  ...archiveScript.matchAll(/\["\d{2}", "(assets\/Build%20Archives\/[^"]+)"/g),
];
assert.equal(buildAssets.length, 23, "the blog should contain all 23 build records");
await Promise.all(buildAssets.map(([, path]) => access(new URL(`../${path}`, import.meta.url))));

console.log("site page structure: ok");
