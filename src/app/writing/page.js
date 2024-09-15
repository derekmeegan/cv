export default async function MediumArticles() {
  const res = await fetch(
    "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@derekmeegan",
  );
  const data = await res.json();
  const items = data.items;
  return (
    <section>
      <ul>
        {items.map((item, index) => (
          <div key={index}>
            <a href={item.link} target={"_blank"}>
              <h3>{item.title}</h3>
            </a>
            <br />
          </div>
        ))}
      </ul>
    </section>
  );
}
