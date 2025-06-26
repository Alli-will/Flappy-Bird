import { cacheMatch } from "../cache";

function update() {
  const time = Date.now()

  for (const [_, value] of cacheMatch) {
    if (!value.isPaused) {
      value.update(time)
    }
  }
}

function gameUpdate() {
  setInterval(update, 100);
}


export { gameUpdate }