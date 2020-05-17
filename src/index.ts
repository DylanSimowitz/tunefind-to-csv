import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from "fs";

export class Tunefind {
  public static TUNEFIND_URL = "https://www.tunefind.com";
  private seasons: string[] = [];
  private episodes: string[] = [];
  private songs: string[][] = [];
  constructor(private show: string) {}
  public async start() {
    await this.getSeasonLinks();
    await this.getEpisodeLinks();
    await this.getSongs();

    this.songsToCSV();
  }
  private async getSeasonLinks() {
    const document = await fetch(
      Tunefind.TUNEFIND_URL + "/show/" + this.show
    ).then((res) => res.text());
    const $ = cheerio.load(document);
    this.seasons = $("h3 > a")
      .map((_, el) => {
        return el.attribs["href"];
      })
      .get() as string[];
  }
  private async getEpisodeLinks() {
    this.episodes = await Promise.all(
      this.seasons.map(async (season) => {
        const document = await fetch(
          Tunefind.TUNEFIND_URL + season
        ).then((res) => res.text());
        const $ = cheerio.load(document);
        return $("h3 > a")
          .map((_, el) => {
            return el.attribs["href"];
          })
          .get() as string[];
      })
    ).then((arr) => arr.flat());
  }
  private async getSongs() {
    for (const episode of this.episodes) {
      const document = await fetch(
        Tunefind.TUNEFIND_URL + episode
      ).then((res) => res.text());
      const $ = cheerio.load(document);
      const music = JSON.parse(
        $("script[type='application/ld+json']").html() as string
      );
      this.songs = [
        ...this.songs,
        ...(music.track.map((track: any) => {
          return [track.name, track.inAlbum.name, track.byArtist];
        }) as string[][]),
      ];
      await setTimeout(() => {}, Math.random() * 3000);
    }
  }
  private songsToCSV(headers = ["title", "album", "artist"]) {
    const csv =
      headers.join() +
      "\n" +
      this.songs
        .map((song) => {
          return song.join();
        })
        .join("\n");

    fs.writeFileSync("songs.csv", csv);
  }
}

(async () => {
  const tf = new Tunefind("the-sopranos");
  await tf.start();
})();
