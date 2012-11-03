var SN = {};

SN.World = function (canvas) {
	this.ctx = canvas.getContext('2d');
};

SN.World.prototype.start = function () {
	this.initWorld();
	this.attachEvents();
	this.initGame();
};

SN.World.prototype.initWorld = function () {
	this.ctx.canvas.width = SN.Sizes.width;
	this.ctx.canvas.height = SN.Sizes.height;
};

SN.World.prototype.attachEvents = function() {
	var self = this;
	$(document).keydown(function (e) {
		e.preventDefault();
		self.updateDirectionBuffer(e.keyCode);
	});
	$(document).bind('touchstart', function (e) {
		e.preventDefault();
		self.setTouchStartDirection(e);
	});
	$(document).bind('touchmove', function (e) {
		e.preventDefault();
		self.updateDirectionBufferByTouch(e);
	});
};


SN.World.prototype.initGame = function () {
	var xPos = Math.floor(SN.Sizes.maxBlockPosX / 2);
	var yPos = Math.floor(SN.Sizes.maxBlockPosY / 2);
	this.snake = new SN.Snake({
		x: xPos,
		y: yPos,
		direction: SN.Directions.start,
	});
	this.grid = [];
	for (var i = 0; i <= SN.Sizes.maxBlockPosX; i += 1) {
		var row = [];
		for (var j = 0; j <= SN.Sizes.maxBlockPosY; j += 1) {
			row.push(SN.BlockState.empty);
		}
		this.grid.push(row);
	}
	this.lastTime = Date.now();
	this.directionBuffer = SN.Directions.start;
	this.points = 0;
	this.grid[xPos][yPos] = SN.BlockState.snake;
	this.generateFood();
	this.drawBlocks();
	this.advance();
};

SN.World.prototype.advance = function () {
	var self = this;
	this.clock = setInterval(function () {
		self.changeDirection();
		var headBlock = self.snake.move();
		if (self.isSnakeDead()) {	
			self.endGame();
		}
		else {
			self.checkEating();
			self.markBlock(headBlock.x, headBlock.y, SN.BlockState.snake);
		}
		self.drawBlocks();
	}, SN.Sizes.MSPF);

};

SN.World.prototype.endGame = function () {
	clearInterval(this.clock);
	var playAgain = confirm('You Scored ' + this.points + ' Points!\nPlay Again?');
	if(playAgain) {
		this.initGame();
	}
};

SN.World.prototype.updateDirectionBuffer = function (direction) {
	if(((this.snake.direction == SN.Directions.up && direction != SN.Directions.down) ||
		(this.snake.direction == SN.Directions.right && direction != SN.Directions.left) ||
		(this.snake.direction == SN.Directions.down && direction != SN.Directions.up) ||
		(this.snake.direction == SN.Directions.left && direction != SN.Directions.right)) &&
		(direction >= SN.Directions.left && direction <= SN.Directions.down)) {
		this.directionBuffer = direction;
	}
};

SN.World.prototype.setTouchStartDirection = function (e) {
	var touchStart = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
	this.touchStartX = touchStart.pageX - this.ctx.canvas.offsetLeft;
	this.touchStartY = touchStart.pageY;
}
SN.World.prototype.updateDirectionBufferByTouch = function (e) {
	var touchEnd = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
	var endX = touchEnd.pageX - this.ctx.canvas.offsetLeft
	var endY = touchEnd.pageY;
	var xDiff = endX - this.touchStartX;
	var yDiff = endY - this.touchStartY;
	if (Math.abs(xDiff) >= Math.abs(yDiff)) {
		if(xDiff > 0) {
			this.directionBuffer = SN.Directions.right;
		}
		else {
			this.directionBuffer = SN.Directions.left;
		}
	}
	else {
		if(yDiff > 0) {
			this.directionBuffer = SN.Directions.down;
		}
		else {
			this.directionBuffer = SN.Directions.up;
		}
	}
}
SN.World.prototype.changeDirection = function() {
	this.snake.direction = this.directionBuffer;
}
SN.World.prototype.drawBlock = function (x, y, blockType) {
	var drawX = SN.Sizes.block * x;
	var drawY = SN.Sizes.block * y;
	if (blockType == SN.BlockState.empty) {
		this.ctx.fillStyle = SN.Colors.empty;
	}
	else if (blockType == SN.BlockState.snake) {
		this.ctx.fillStyle = SN.Colors.snake;
	}
	else { 
		this.ctx.fillStyle = SN.Colors.food;
	}
	this.ctx.fillRect(drawX, drawY, SN.Sizes.block, SN.Sizes.block);
	this.ctx.strokeRect(drawX, drawY, SN.Sizes.block, SN.Sizes.block);
};

SN.World.prototype.drawBlocks = function () {
	this.ctx.clearRect(0, 0, SN.Sizes.width, SN.Sizes.height);
	for (var i = 0; i <= SN.Sizes.maxBlockPosX; i += 1) {
		for (var j = 0; j <= SN.Sizes.maxBlockPosY; j += 1) {
			this.drawBlock(i, j, this.grid[i][j]);
		}
	}
};

SN.World.prototype.markBlock = function(x, y, state) {
	this.grid[x][y] = state;
}

SN.World.prototype.generateFood = function () {
	var xPos;
	var yPos;
	do {
		xPos = Math.floor(Math.random() * (SN.Sizes.maxBlockPosX + 1));
		yPos = Math.floor(Math.random() * (SN.Sizes.maxBlockPosY + 1));
	} while (this.grid[xPos][yPos] != SN.BlockState.empty);
	this.markBlock(xPos, yPos, SN.BlockState.food);
}

SN.World.prototype.checkEating = function () {
	if (this.grid[this.snake.body[0].x][this.snake.body[0].y] != SN.BlockState.food) {
		var emptiedBlock = this.snake.body.pop();
		this.markBlock(emptiedBlock.x, emptiedBlock.y, SN.BlockState.empty);
	}
	// has ate
	else {
		this.generateFood();
		this.points += SN.Sizes.point;
	}
}

SN.World.prototype.isSnakeDead = function () {
	if (this.snake.body[0].x < 0 || this.snake.body[0].x > SN.Sizes.maxBlockPosX) {
		return true;
	}
	if (this.snake.body[0].y < 0 || this.snake.body[0].y > SN.Sizes.maxBlockPosY) {
		return true;
	}
	if (this.grid[this.snake.body[0].x][this.snake.body[0].y] == SN.BlockState.snake) {
		return true;
	}
	return false;
}

SN.Snake = function (options) {
	this.body = [];
	this.body.push(new SN.Block(options.x, options.y));
	this.direction = options.direction;
};

SN.Snake.prototype.move = function () {
	var nextX = this.body[0].x;
	var nextY = this.body[0].y;
	var nextBlock = new SN.Block(nextX, nextY);
	if (this.direction == SN.Directions.up) {
		nextBlock.y -= 1;
	}
	else if (this.direction == SN.Directions.down) {
		nextBlock.y += 1;
	}
	else if (this.direction == SN.Directions.left) {
		nextBlock.x -= 1;
	}
	else {
		nextBlock.x += 1;
	}
	this.body.unshift(nextBlock);
	return nextBlock;
};

SN.Block = function (x, y) {
	this.x = x;
	this.y = y;
};

SN.BlockState = {
	empty: 0,
	snake: 1,
	food: 2,
};

SN.Directions = {
	up: 38,
	right: 39,
	down: 40,
	left: 37,
};

SN.Sizes = {
	point: 5,
	MSPF: 250,
};


(function () {
	var width = $(window).width();
	var height = $(window).height();
	if (width >= height) {
		SN.Sizes.width = width;
		SN.Sizes.block = width / 20;
		SN.Sizes.height = Math.floor(height - height % SN.Sizes.block);
		SN.Directions.start = SN.Directions.right;
	}
	else {
		SN.Sizes.height = height;
		SN.Sizes.block = height / 20;
		SN.Sizes.width = Math.floor(width - width % SN.Sizes.block);
		SN.Directions.start = SN.Directions.up;
	}
	SN.Sizes.maxBlockPosX = Math.round(SN.Sizes.width / SN.Sizes.block) - 1;
	SN.Sizes.maxBlockPosY = Math.round(SN.Sizes.height / SN.Sizes.block) - 1;

})();

SN.Colors = {
	empty: '#181818',
	snake: 'green',
	food: '#0af',
};

$(document).ready( function () {
  world = new SN.World($('#gameview')[0]);
	world.start();
});
