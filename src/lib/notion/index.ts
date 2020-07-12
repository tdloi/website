import slugify from "slugify";
import { getTable, getPage } from "./getData";
import { BLOG_INDEX_ID, INDEX_ID } from "../../constants";
import { IBlogEntry, IGetTableOptions } from "../../interfaces";
import { format } from "../../helpers";

export async function getBlogList(options: IGetTableOptions): Promise<IBlogEntry[] | null> {
  const contentsList = await getTable(BLOG_INDEX_ID, { limit: 999, published: true, ...options });

  const schema = Object.values(contentsList.recordMap.collection)[0].value.schema;
  const blockIds = contentsList.result.blockIds;
  const lists = blockIds.map<IBlogEntry>((id) => {
    const post = Object.keys(schema).reduce(
      (result: IBlogEntry, index) => {
        const prop_value = contentsList.recordMap.block[id].value.properties?.[index];
        const key = schema[index].name.toLowerCase();
        let value = null;

        if (prop_value == undefined) {
          if (schema[index].type === "checkbox") {
            value = false;
          }
          result[key] = value;
          return result;
        }

        switch (schema[index].type) {
          case "date":
            // @ts-ignore
            value = prop_value[0][1][0][1].start_date;
            break;
          case "checkbox":
            value = prop_value[0][0] === "Yes";
            break;
          case "multi_select":
            // @ts-ignore
            value = prop_value[0][0].split(",");
            break;
          default:
            value = prop_value[0][0];
        }
        result[key] = value;
        return result;
      },
      {
        id: id,
        published: false,
      } as IBlogEntry
    );
    return post;
  });

  if (lists.length === 0) return null;

  return lists.map<IBlogEntry>((item: IBlogEntry) => {
    if (item.slug == null) {
      item.slug = slugify(item.name);
    }
    item.year = parseInt(item.date); // year-month-day
    return item;
  });
}

export async function getIndex() {
  const data = await getPage(INDEX_ID);
  const content: any = {};
  let label = null;
  let labelContent = [];

  for (let key of data.recordMap.block[INDEX_ID].value.content) {
    const item = data.recordMap.block[key].value;

    if (item.properties == undefined) {
      if (label != null) {
        labelContent.push({ tag: "br", attr: {}, content: null }); // empty line
      }
      continue;
    }

    if (item.type === "header") {
      if (label !== null) {
        content[label] = labelContent;
      }
      label = item.properties.title[0][0].toLowerCase();
      labelContent = [];
      continue;
    }
    labelContent.push(format(item));
  }

  if (label != null) {
    content[label] = labelContent;
  }
  return content;
}

export async function getPost() {}
