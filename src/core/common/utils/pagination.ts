export function handlePageCount(
  page: number,
  length: number,
  limit: number,
  total_count: number,
) {
  let current_count = (page - 1) * limit;
  current_count = current_count + length;
  let page_count = Math.ceil(total_count / limit);
  return { current_count, page_count };
}
