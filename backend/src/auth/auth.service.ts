import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async validateUser(details: any) {
        let user = await this.usersRepository.findOne({ where: { email: details.email } });
        if (!user) {
            user = this.usersRepository.create({
                email: details.email,
                nickname: `${details.firstName} ${details.lastName}`,
                avatarUrl: details.picture,
                provider: 'google',
            });
            await this.usersRepository.save(user);
        }
        return user;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
