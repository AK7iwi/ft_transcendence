/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pong.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/18 23:38:46 by marvin            #+#    #+#             */
/*   Updated: 2025/03/19 02:24:11 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// window.onload = () =>
// {
//     const pongElement = document.getElementById('pong');
//     if (pongElement)
//         pongElement.innerHTML = '<p>Bienvenue dans la jungle!</p>';
// };

window.onload = () =>
{
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx)
    {
        console.error("Canvas not supported.");
        return ;
    }

    function draw() // this is the canvas
    {
        // background
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // paddles
        ctx.fillStyle = "white";
        ctx.fillRect(10, 175, 5, 50);
        ctx.fillRect(785, 175, 5, 50);
        
        // ball
        ctx.beginPath();
        ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // ball properties
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = (Math.random()) * 3;
    let ballSpeedY = (Math.random()) * 2;
    
    function update() // update ball movement
    {
        ballX += ballSpeedX;
        ballY += ballSpeedY;
        
        if (ballY <= 0 || ballY >= canvas.height)
            ballSpeedY = -ballSpeedY;

        if (ballX <= 0 || ballX >= canvas.width)
        {
            ballX = canvas.width / 2;
            ballY = canvas.height / 2;
            ballSpeedX = (Math.random()) * 3;
            ballSpeedY = (Math.random()) * 2;
        }
    }

    function gameLoop()
    {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
}