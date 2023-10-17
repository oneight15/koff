import { likeSvg } from "../likeSvg/likeSvg";

export class LikeButton {
  constructor(className) {
    this.className = className;
  }

  create(id) {
    const button = document.createElement('button');
    button.classList.add(this.className);
    button.dataset.id = id;
    // button.type = 'button';

    button.addEventListener('click', () => {
      console.log('Добавить товар в избранное');
    });

    likeSvg().then(svg => {
      button.append(svg);
    });

    return button;
  }
}