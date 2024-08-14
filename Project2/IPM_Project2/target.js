// Target class (position and width)
class Target
{
  constructor(x, y, w, l, id)
  {
    this.x      = x;
    this.y      = y;
    this.width  = w;
    this.label  = l;
    this.id     = id;
    this.used   = false;
  }
  
  hovered() {
    //return dist(this.x, this.y, mouseX, mouseY) < this.width / 2;
    return ((this.x - this.width/2) <= mouseX && mouseX <= (this.x + this.width/2)) && ((this.y - this.width/2) <= mouseY && mouseY <= (this.y + this.width/2));
  }
  
  // Checks if a mouse click took place
  // within the target
  clicked(mouse_x, mouse_y)
  {
    return ((this.x - this.width/2) <= mouse_x && mouse_x <= (this.x + this.width/2)) && ((this.y - this.width/2) <= mouse_y && mouse_y <= (this.y + this.width/2));
    //return dist(this.x, this.y, mouse_x, mouse_y) < this.width / 2;
  }
  
  // Draws the target (i.e., a circle)
  // and its label
  draw(colorr, prefix)
  {
    // Draw target
    if (this.hovered()) {
      fill(TARGET_HOVER_COLOR);
      cursor_pointer = true;
    } else {
      fill(colorr);
    }
    rect(this.x - this.width/2, this.y - this.width/2, this.width, this.width, 6);
    //circle(this.x, this.y, this.width);

  // Draw label
  textFont('Roboto', 14);
  textAlign(CENTER);
  stroke(0); // Define o contorno para preto
  strokeWeight(3); // Ajusta a espessura do contorno
  fill(255); // Define o preenchimento para branco
  text(this.label, this.x, this.y);

  // Draw prefix
  textFont('Roboto', 30);
  textAlign(CENTER);
  stroke(0); // Define o contorno para preto
  strokeWeight(3); // Ajusta a espessura do contorno
  fill(255); // Define o preenchimento para branco
  prefix = prefix.toUpperCase();
  text(prefix, this.x-5, this.y - this.width/2+25);  


  }
}