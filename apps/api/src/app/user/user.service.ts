import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { user_id: userId } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { verification_token: token },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { reset_token: token } });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { last_login: new Date() });
  }

  async updatePassword(userId: string, hashed_password: string): Promise<void> {
    await this.userRepository.update(userId, { hashed_password });
  }
  async update(userId: string, data: Partial<User>): Promise<void> {
    await this.userRepository.update(userId, data);
  }
}
