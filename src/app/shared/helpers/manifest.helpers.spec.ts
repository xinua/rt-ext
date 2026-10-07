import { parseDash, parseHls, qualitiesOf, qualityOf, urlQualities } from './manifest.helpers';

const HLS = `#EXTM3U
#EXT-X-STREAM-INF:RESOLUTION=1920x1080,BANDWIDTH=2128000
https://ceramet.net/x/J5Qk6zCH6rsEP0bWYFfPrw/1791410701/2925503/1080/index.m3u8
#EXT-X-STREAM-INF:RESOLUTION=1280x720,BANDWIDTH=1096000
https://ceramet.net/x/Gmi291uy3g1rARh_ADfb2g/1791410701/2925503/720/index.m3u8
#EXT-X-STREAM-INF:RESOLUTION=854x480,BANDWIDTH=714000
https://ceramet.net/x/AKHbvESsVqA6dDQmcODJaA/1791410701/2925503/480/index.m3u8
#EXT-X-STREAM-INF:RESOLUTION=640x360,BANDWIDTH=414000
https://ceramet.net/x/7TdERx8y1aedNI8tnvdM5A/1791410701/2925503/360/index.m3u8
`;

const HLS_REORDERED = `#EXTM3U\r
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=406000,RESOLUTION=426x240\r
./240.mp4:hls:manifest.m3u8\r
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=5592000,CODECS="avc1.640028,mp4a.40.2",RESOLUTION=1920x1080\r
./1080.mp4:hls:manifest.m3u8\r
`;

const DASH = `<?xml version="1.0"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" mediaPresentationDuration="PT1426.640S">
  <Period>
    <AdaptationSet id="1" segmentAlignment="true" maxWidth="1920" maxHeight="1080">
      <SegmentTemplate timescale="1000" media="https://play.dreamerscast.com/dash/x_,1080,720,low,opus,.mp4.urlset/fragment-$Number$-$RepresentationID$.m4s" startNumber="1">
        <SegmentTimeline><S d="10010" r="3"/></SegmentTimeline>
      </SegmentTemplate>
      <Representation id="f1-v1-x3" mimeType="video/mp4" codecs="av01.0.09M.08" width="1920" height="1080" bandwidth="1795754"/>
      <Representation id="f2-v1-x3" mimeType="video/mp4" codecs="av01.0.09M.08" width="1280" height="720" bandwidth="1091221"/>
      <Representation id="f3-v1-x3" mimeType="video/mp4" codecs="av01.0.06M.08" width="854" height="480" bandwidth="703236"/>
    </AdaptationSet>
    <AdaptationSet id="2" segmentAlignment="true">
      <Representation id="f4-a1-x3" mimeType="audio/mp4" codecs="opus" audioSamplingRate="48000" bandwidth="188413"/>
    </AdaptationSet>
  </Period>
</MPD>`;

describe('qualityOf', () => {
  it('maps standard sizes to their label', () => {
    expect(qualityOf({ width: 3840, height: 2160 })).toBe(2160);
    expect(qualityOf({ width: 1280, height: 720 })).toBe(720);
    expect(qualityOf({ width: 854, height: 480 })).toBe(480);
    expect(qualityOf({ width: 426, height: 240 })).toBe(240);
  });

  it('keeps letterboxed, cropped and vertical frames in their tier', () => {
    expect(qualityOf({ width: 1920, height: 800 })).toBe(1080);
    expect(qualityOf({ width: 1916, height: 1076 })).toBe(1080);
    expect(qualityOf({ width: 720, height: 1280 })).toBe(720);
  });

  it('falls back to the short side below every tier', () => {
    expect(qualityOf({ width: 160, height: 90 })).toBe(90);
  });
});

describe('qualitiesOf', () => {
  it('dedupes and sorts best first', () => {
    expect(
      qualitiesOf([
        { width: 854, height: 480 },
        { width: 1920, height: 1080 },
        { width: 1920, height: 1080 },
      ]),
    ).toEqual([1080, 480]);
  });
});

describe('urlQualities', () => {
  it('picks qualities named in the URL', () => {
    expect(urlQualities('https://cdn.example.com/x_,1080,720,low,.urlset/manifest.mpd')).toEqual([
      1080, 720,
    ]);
    expect(urlQualities('https://cdn.example.com/master.m3u8')).toEqual([]);
  });
});

describe('parseHls', () => {
  it('reads every variant of a master playlist', () => {
    expect(qualitiesOf(parseHls(HLS))).toEqual([1080, 720, 480, 360]);
  });

  it('finds RESOLUTION in any position, past quoted commas and CRLF', () => {
    expect(parseHls(HLS_REORDERED)).toEqual([
      { width: 426, height: 240 },
      { width: 1920, height: 1080 },
    ]);
  });

  it('finds nothing in a media playlist', () => {
    expect(
      parseHls('#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10.0,\nseg-1.ts\n#EXT-X-ENDLIST\n'),
    ).toEqual([]);
  });
});

describe('parseDash', () => {
  it('reads video representations and skips audio', () => {
    expect(qualitiesOf(parseDash(DASH))).toEqual([1080, 720, 480]);
  });

  it('inherits sizes from the AdaptationSet', () => {
    const mpd = `<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"><Period>
      <AdaptationSet mimeType="video/mp4" width="1280" height="720"><Representation id="1" bandwidth="1"/></AdaptationSet>
    </Period></MPD>`;
    expect(parseDash(mpd)).toEqual([{ width: 1280, height: 720 }]);
  });

  it('falls back to maxWidth/maxHeight when no representation has a size', () => {
    const mpd = `<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"><Period>
      <AdaptationSet contentType="video" maxWidth="3840" maxHeight="2160"><Representation id="1" bandwidth="1"/></AdaptationSet>
    </Period></MPD>`;
    expect(parseDash(mpd)).toEqual([{ width: 3840, height: 2160 }]);
  });

  it('returns nothing for invalid XML', () => {
    expect(parseDash('<MPD><Period>')).toEqual([]);
  });
});
